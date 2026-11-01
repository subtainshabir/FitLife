import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userNutritionPreferences, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const preferencesSchema = z.object({
  dailyBudget: z.number().min(100).max(50000).default(500),
  budgetPeriod: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  currency: z.string().default("PKR"),
  city: z.string().default("Rawalpindi"),
  mealsPerDay: z.number().int().min(3).max(6).default(4),
  cookingTimeMinutes: z.number().int().min(10).max(180).default(30),
  dietaryType: z.enum(["standard", "halal", "high_protein", "low_carb", "vegetarian"]).default("standard"),
  preferredFoods: z.array(z.string()).default([]),
  excludedFoods: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default(["halal"]),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const [pref] = await db
      .select()
      .from(userNutritionPreferences)
      .where(eq(userNutritionPreferences.userId, session.user.id))
      .limit(1);

    // Also fetch profile for city if preference hasn't been set yet
    let city = pref?.city || "Rawalpindi";
    if (!pref) {
      const [profile] = await db
        .select({ city: userProfiles.city })
        .from(userProfiles)
        .where(eq(userProfiles.userId, session.user.id))
        .limit(1);
      if (profile?.city) city = profile.city;
    }

    return NextResponse.json({
      preferences: pref || {
        dailyBudget: 500,
        budgetPeriod: "daily",
        currency: "PKR",
        city,
        mealsPerDay: 4,
        cookingTimeMinutes: 30,
        dietaryType: "standard",
        preferredFoods: [],
        excludedFoods: [],
        allergies: [],
        dietaryRestrictions: ["halal"],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;
    const [updated] = await db
      .insert(userNutritionPreferences)
      .values({
        userId: session.user.id,
        ...data,
      })
      .onConflictDoUpdate({
        target: userNutritionPreferences.userId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ preferences: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save preferences" }, { status: 500 });
  }
}

