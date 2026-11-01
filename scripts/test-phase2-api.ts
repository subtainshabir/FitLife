import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  calculateFullAssessment,
  calculateGoalTimeline,
} from "../src/lib/services/fitness-calculator";

console.log("=== FITLIFE AI: PHASE 2 DATABASE & API INTEGRATION TESTS ===\n");

async function runPhase2IntegrationTests() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client, { schema });

  let testUserId: string | null = null;

  try {
    // 1. Create a dedicated test user
    console.log("[1] Creating test user for Phase 2 integration...");
    const testEmail = `phase2_tester_${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash("SecurePass123!", 10);

    const [user] = await db
      .insert(schema.users)
      .values({
        name: "Phase 2 Athlete",
        email: testEmail,
        passwordHash,
      })
      .returning();

    testUserId = user.id;
    console.log(`✓ PASS: Created test user with ID: ${testUserId}`);

    // Create user profile
    await db.insert(schema.userProfiles).values({
      userId: testUserId,
      gender: "male",
      height: 180,
      currentWeight: 80,
      activityLevel: "moderately_active",
      fitnessGoal: "weight_loss",
      fitnessExperience: "intermediate",
    });
    console.log("✓ PASS: Profile initialized for test user");

    // 2. Test Assessment Persistence
    console.log("\n[2] Testing Body Assessment persistence...");
    const assessmentResult = calculateFullAssessment({
      weightKg: 80,
      heightCm: 180,
      age: 28,
      gender: "male",
      activityLevel: "moderately_active",
      fitnessExperience: "intermediate",
      primaryGoal: "weight_loss",
    });

    const [assessmentRecord] = await db
      .insert(schema.bodyAssessments)
      .values({
        userId: testUserId,
        age: 28,
        gender: "male",
        height: 180,
        weight: 80,
        activityLevel: "moderately_active",
        fitnessExperience: "intermediate",
        primaryGoal: "weight_loss",
        bmi: assessmentResult.summary.bmi,
        bmiCategory: assessmentResult.summary.bmiCategory,
        bmr: assessmentResult.summary.bmr,
        tdee: assessmentResult.summary.tdee,
        targetCalories: assessmentResult.summary.dailyCalories,
        targetProteinGrams: assessmentResult.summary.proteinGrams,
        targetCarbsGrams: assessmentResult.summary.carbsGrams,
        targetFatGrams: assessmentResult.summary.fatGrams,
        isMinor: false,
        hasHealthWarning: false,
        calculationNotes: {
          formula: assessmentResult.bmr.formula,
          safety: assessmentResult.nutrition.safetyWarnings,
        },
      })
      .returning();

    if (!assessmentRecord || assessmentRecord.userId !== testUserId) {
      throw new Error("Failed to insert body assessment");
    }
    console.log(`✓ PASS: Assessment created with ID: ${assessmentRecord.id}`);
    console.log(`  BMI: ${assessmentRecord.bmi} (${assessmentRecord.bmiCategory}), BMR: ${assessmentRecord.bmr}, TDEE: ${assessmentRecord.tdee}, Target Calories: ${assessmentRecord.targetCalories}`);

    // Verify retrieval of latest assessment
    const [latest] = await db
      .select()
      .from(schema.bodyAssessments)
      .where(eq(schema.bodyAssessments.userId, testUserId))
      .orderBy(desc(schema.bodyAssessments.createdAt))
      .limit(1);

    if (latest.id !== assessmentRecord.id) {
      throw new Error("Latest assessment query failed to retrieve correct record");
    }
    console.log("✓ PASS: Latest assessment correctly queried by user ID and timestamp");

    // 3. Test Fitness Goal Creation & Management
    console.log("\n[3] Testing Fitness Goals Management...");
    const timeline = calculateGoalTimeline(80, 74, 0.5, new Date());

    const [goal] = await db
      .insert(schema.fitnessGoals)
      .values({
        userId: testUserId,
        goalType: "weight_loss",
        currentWeight: 80,
        targetWeight: 74,
        targetRate: 0.5,
        startDate: new Date(),
        targetDate: timeline.estimatedCompletionDate,
        status: "in_progress",
        notes: "Targeting gradual 6 kg loss over 12 weeks",
      })
      .returning();

    console.log(`✓ PASS: Goal created with ID: ${goal.id}`);
    console.log(`  Current: ${goal.currentWeight}kg -> Target: ${goal.targetWeight}kg at ${goal.targetRate}kg/wk`);

    // Test goal update (PATCH operation)
    const [updatedGoal] = await db
      .update(schema.fitnessGoals)
      .set({
        currentWeight: 78,
        status: "in_progress",
        notes: "Down 2 kg in 4 weeks!",
      })
      .where(and(eq(schema.fitnessGoals.id, goal.id), eq(schema.fitnessGoals.userId, testUserId)))
      .returning();

    if (updatedGoal.currentWeight !== 78) {
      throw new Error("Goal update failed");
    }
    console.log(`✓ PASS: Goal successfully updated (currentWeight: ${updatedGoal.currentWeight}kg)`);

    // 4. Test Body Measurement History Tracking
    console.log("\n[4] Testing Body Measurement History...");
    const now = new Date();
    await db.insert(schema.bodyMeasurementHistory).values([
      {
        userId: testUserId,
        weight: 80.0,
        height: 180,
        unit: "kg",
        source: "assessment",
        recordedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      },
      {
        userId: testUserId,
        weight: 79.2,
        height: 180,
        unit: "kg",
        source: "manual",
        recordedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        userId: testUserId,
        weight: 78.5,
        height: 180,
        unit: "kg",
        source: "manual",
        recordedAt: now,
      },
    ]);

    const weightLogs = await db
      .select()
      .from(schema.bodyMeasurementHistory)
      .where(eq(schema.bodyMeasurementHistory.userId, testUserId))
      .orderBy(desc(schema.bodyMeasurementHistory.recordedAt));

    if (weightLogs.length !== 3) {
      throw new Error(`Expected 3 weight log entries, got ${weightLogs.length}`);
    }
    console.log(`✓ PASS: Recorded ${weightLogs.length} weight entries over time`);
    console.log(`  Weight progression: ${weightLogs.map((l) => `${l.weight}kg`).reverse().join(" -> ")}`);

    // 5. Foreign Key Cascade Deletion Check
    console.log("\n[5] Testing Foreign Key Cascade Deletion on User Deletion...");
    await db.delete(schema.users).where(eq(schema.users.id, testUserId));

    const remainingAssessments = await db
      .select()
      .from(schema.bodyAssessments)
      .where(eq(schema.bodyAssessments.userId, testUserId));

    const remainingGoals = await db
      .select()
      .from(schema.fitnessGoals)
      .where(eq(schema.fitnessGoals.userId, testUserId));

    const remainingMeasurements = await db
      .select()
      .from(schema.bodyMeasurementHistory)
      .where(eq(schema.bodyMeasurementHistory.userId, testUserId));

    if (
      remainingAssessments.length !== 0 ||
      remainingGoals.length !== 0 ||
      remainingMeasurements.length !== 0
    ) {
      throw new Error("Cascade deletion failed: Orphaned records detected!");
    }
    console.log("✓ PASS: Cascade deletion completely removed user's goals, assessments, and measurement history!");

    console.log("\n=======================================================");
    console.log("ALL PHASE 2 DATABASE & INTEGRATION TESTS PASSED! ✓");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPhase2IntegrationTests();

