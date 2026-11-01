import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bodyAssessments, bodyMeasurementHistory, userProfiles } from "@/db/schema";
import { assessmentCalculationSchema } from "@/lib/validations/assessment";
import {
  calculateFullAssessment,
  lbsToKg,
  ftInToCm,
  ActivityLevel,
  FitnessGoalType,
} from "@/lib/services/fitness-calculator";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to perform a body assessment." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = assessmentCalculationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const userId = session.user.id;

    // Convert imperial to metric if needed for server-side standardization
    let weightKg = data.weight;
    let heightCm = data.height;

    if (data.unit === "imperial") {
      weightKg = lbsToKg(data.weight);
      // If height came in inches or ft-in
      // If user passed height in cm or inches: when imperial, assume height is total inches
      if (data.height < 100) {
        // e.g. 68 inches
        heightCm = Math.round(data.height * 2.54 * 10) / 10;
      }
    }

    // Execute server-side deterministic calculation
    const assessmentResult = calculateFullAssessment({
      weightKg,
      heightCm,
      age: data.age,
      gender: data.gender,
      activityLevel: data.activityLevel as ActivityLevel,
      fitnessExperience: data.fitnessExperience,
      primaryGoal: data.primaryGoal as FitnessGoalType,
      healthConditions: data.healthConditions,
      isPregnant: data.isPregnant,
    });

    const now = new Date();

    // Persist assessment to database
    const [savedAssessment] = await db
      .insert(bodyAssessments)
      .values({
        userId,
        age: data.age,
        gender: data.gender || "prefer_not_to_say",
        height: heightCm,
        weight: weightKg,
        activityLevel: data.activityLevel,
        fitnessExperience: data.fitnessExperience,
        primaryGoal: data.primaryGoal,
        bmi: assessmentResult.summary.bmi,
        bmiCategory: assessmentResult.summary.bmiCategory,
        bmr: assessmentResult.summary.bmr,
        tdee: assessmentResult.summary.tdee,
        targetCalories: assessmentResult.summary.dailyCalories,
        targetProteinGrams: assessmentResult.summary.proteinGrams,
        targetCarbsGrams: assessmentResult.summary.carbsGrams,
        targetFatGrams: assessmentResult.summary.fatGrams,
        isMinor: assessmentResult.summary.isMinor,
        hasHealthWarning: assessmentResult.summary.hasHealthWarning,
        calculationNotes: {
          formulaExplanation: assessmentResult.bmr.formula,
          sexExplanation: assessmentResult.bmr.sexExplanation,
          bmiExplanation: assessmentResult.bmi.explanation,
          bmiDisclaimer: assessmentResult.bmi.disclaimer,
          tdeeExplanation: assessmentResult.tdee.explanation,
          nutritionExplanation: assessmentResult.nutrition.explanation,
          nutritionDisclaimer: assessmentResult.nutrition.disclaimer,
          safetyWarnings: assessmentResult.nutrition.safetyWarnings,
          macroPercentages: {
            protein: assessmentResult.nutrition.protein.percentage,
            carbs: assessmentResult.nutrition.carbs.percentage,
            fat: assessmentResult.nutrition.fat.percentage,
          },
        },
        healthNotes: data.healthConditions.join(", ") || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Also record this measurement in measurement history
    await db.insert(bodyMeasurementHistory).values({
      userId,
      weight: weightKg,
      height: heightCm,
      unit: "kg",
      source: "assessment",
      notes: `Assessment snapshot (BMI: ${assessmentResult.summary.bmi})`,
      recordedAt: now,
      createdAt: now,
    });

    // Optionally update user's profile with latest physical attributes
    if (data.saveToProfile) {
      await db
        .update(userProfiles)
        .set({
          height: heightCm,
          currentWeight: weightKg,
          activityLevel: data.activityLevel,
          fitnessExperience: data.fitnessExperience,
          fitnessGoal: data.primaryGoal,
          gender: data.gender || undefined,
          updatedAt: now,
        })
        .where(eq(userProfiles.userId, userId));
    }

    return NextResponse.json(
      {
        message: "Assessment calculated and saved successfully.",
        assessment: savedAssessment,
        calculation: assessmentResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assessment calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during assessment calculation." },
      { status: 500 }
    );
  }
}

