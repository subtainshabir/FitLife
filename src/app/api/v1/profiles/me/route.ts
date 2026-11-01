import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userProfiles, users, userSettings } from "@/db/schema";
import { profileSchema, updateProfileSchema } from "@/lib/validations/profile";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to access your profile." },
        { status: 401 }
      );
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json(
      {
        profile: profile || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to create your profile." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = profileSchema.safeParse(body);

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

    // Check if profile already exists
    const [existingProfile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const now = new Date();

    const [savedProfile] = await db.transaction(async (tx) => {
      // If user supplied a name update
      if (data.name) {
        await tx
          .update(users)
          .set({ name: data.name, updatedAt: now })
          .where(eq(users.id, userId));
      }

      // Update preferred language in settings if provided
      if (data.preferredLanguage) {
        await tx
          .update(userSettings)
          .set({ language: data.preferredLanguage, updatedAt: now })
          .where(eq(userSettings.userId, userId));
      }

      if (existingProfile) {
        return tx
          .update(userProfiles)
          .set({
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender || null,
            height: data.height ?? null,
            currentWeight: data.currentWeight ?? null,
            country: data.country || null,
            city: data.city || null,
            preferredCurrency: data.preferredCurrency || "USD",
            preferredLanguage: data.preferredLanguage || "en",
            activityLevel: data.activityLevel || null,
            fitnessExperience: data.fitnessExperience || null,
            fitnessGoal: data.fitnessGoal || null,
            availableEquipment: data.availableEquipment || [],
            dietaryPreferences: data.dietaryPreferences || [],
            allergies: data.allergies || [],
            dietaryRestrictions: data.dietaryRestrictions || [],
            updatedAt: now,
          })
          .where(eq(userProfiles.userId, userId))
          .returning();
      } else {
        return tx
          .insert(userProfiles)
          .values({
            userId,
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender || null,
            height: data.height ?? null,
            currentWeight: data.currentWeight ?? null,
            country: data.country || null,
            city: data.city || null,
            preferredCurrency: data.preferredCurrency || "USD",
            preferredLanguage: data.preferredLanguage || "en",
            activityLevel: data.activityLevel || null,
            fitnessExperience: data.fitnessExperience || null,
            fitnessGoal: data.fitnessGoal || null,
            availableEquipment: data.availableEquipment || [],
            dietaryPreferences: data.dietaryPreferences || [],
            allergies: data.allergies || [],
            dietaryRestrictions: data.dietaryRestrictions || [],
          })
          .returning();
      }
    });

    return NextResponse.json(
      {
        message: "Profile saved successfully.",
        profile: savedProfile,
      },
      { status: existingProfile ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create profile error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to update your profile." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

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
    const now = new Date();

    const [updatedProfile] = await db.transaction(async (tx) => {
      if (data.name) {
        await tx
          .update(users)
          .set({ name: data.name, updatedAt: now })
          .where(eq(users.id, userId));
      }

      if (data.preferredLanguage) {
        await tx
          .update(userSettings)
          .set({ language: data.preferredLanguage, updatedAt: now })
          .where(eq(userSettings.userId, userId));
      }

      // Check existing
      const [existing] = await tx
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!existing) {
        // create profile if it didn't exist
        return tx
          .insert(userProfiles)
          .values({
            userId,
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender || null,
            height: data.height ?? null,
            currentWeight: data.currentWeight ?? null,
            country: data.country || null,
            city: data.city || null,
            preferredCurrency: data.preferredCurrency || "USD",
            preferredLanguage: data.preferredLanguage || "en",
            activityLevel: data.activityLevel || null,
            fitnessExperience: data.fitnessExperience || null,
            fitnessGoal: data.fitnessGoal || null,
            availableEquipment: data.availableEquipment || [],
            dietaryPreferences: data.dietaryPreferences || [],
            allergies: data.allergies || [],
            dietaryRestrictions: data.dietaryRestrictions || [],
          })
          .returning();
      }

      const updatePayload: Record<string, unknown> = {
        updatedAt: now,
      };

      if (data.dateOfBirth !== undefined) updatePayload.dateOfBirth = data.dateOfBirth || null;
      if (data.gender !== undefined) updatePayload.gender = data.gender || null;
      if (data.height !== undefined) updatePayload.height = data.height;
      if (data.currentWeight !== undefined) updatePayload.currentWeight = data.currentWeight;
      if (data.country !== undefined) updatePayload.country = data.country;
      if (data.city !== undefined) updatePayload.city = data.city;
      if (data.preferredCurrency !== undefined) updatePayload.preferredCurrency = data.preferredCurrency;
      if (data.preferredLanguage !== undefined) updatePayload.preferredLanguage = data.preferredLanguage;
      if (data.activityLevel !== undefined) updatePayload.activityLevel = data.activityLevel;
      if (data.fitnessExperience !== undefined) updatePayload.fitnessExperience = data.fitnessExperience;
      if (data.fitnessGoal !== undefined) updatePayload.fitnessGoal = data.fitnessGoal;
      if (data.availableEquipment !== undefined) updatePayload.availableEquipment = data.availableEquipment;
      if (data.dietaryPreferences !== undefined) updatePayload.dietaryPreferences = data.dietaryPreferences;
      if (data.allergies !== undefined) updatePayload.allergies = data.allergies;
      if (data.dietaryRestrictions !== undefined) updatePayload.dietaryRestrictions = data.dietaryRestrictions;

      return tx
        .update(userProfiles)
        .set(updatePayload)
        .where(eq(userProfiles.userId, userId))
        .returning();
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully.",
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while updating profile." },
      { status: 500 }
    );
  }
}
