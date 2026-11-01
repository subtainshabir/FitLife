import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

console.log("=== FITLIFE AI: PHASE 1 COMPREHENSIVE VERIFICATION ===");

async function runTests() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set in .env.local");
  }
  console.log(`[1] Connecting to PostgreSQL at ${dbUrl}...`);
  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Test 1: PostgreSQL Connection & Health
    const [{ result }] = await client`SELECT 1 as result`;
    if (result === 1) {
      console.log("✓ PASS: PostgreSQL connection verified.");
    } else {
      throw new Error("Failed SELECT 1");
    }

    // Test 2: Verify Tables Exist
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableNames = tables.map((t: any) => t.table_name);
    console.log("Found tables in DB:", tableNames);
    const requiredTables = ["users", "user_profiles", "user_settings"];
    for (const t of requiredTables) {
      if (tableNames.includes(t)) {
        console.log(`✓ PASS: Table '${t}' exists.`);
      } else {
        throw new Error(`Table '${t}' missing!`);
      }
    }

    // Test 3: Password Hashing & Verification
    console.log("[2] Testing Password Hashing & Verification...");
    const rawPass = "StrongP@ssw0rd123";
    const hashed = await bcrypt.hash(rawPass, 12);
    const valid = await bcrypt.compare(rawPass, hashed);
    const invalid = await bcrypt.compare("WrongPassword", hashed);
    if (valid && !invalid) {
      console.log("✓ PASS: Password hashing and comparison verified.");
    } else {
      throw new Error("Password verification failed.");
    }

    // Test 4: Registration & DB Insertion
    console.log("[3] Testing User Registration & Cascade Relations...");
    const testEmail = `athlete_${Date.now()}@fitlife.ai`;
    const testName = "Tariq Mahmood";

    // Clean up if existed
    await db.delete(schema.users).where(eq(schema.users.email, testEmail));

    const [newUser] = await db
      .insert(schema.users)
      .values({
        name: testName,
        email: testEmail,
        passwordHash: hashed,
      })
      .returning();

    console.log(`✓ PASS: User created with ID: ${newUser.id}`);

    // Create Settings
    const [settings] = await db
      .insert(schema.userSettings)
      .values({
        userId: newUser.id,
        theme: "dark",
        language: "ur",
        notificationsEnabled: true,
      })
      .returning();
    console.log(`✓ PASS: User settings created for user: ${settings.userId}`);

    // Create Profile
    const [profile] = await db
      .insert(schema.userProfiles)
      .values({
        userId: newUser.id,
        dateOfBirth: "1995-05-15",
        gender: "male",
        height: 182,
        currentWeight: 78.5,
        country: "Pakistan",
        city: "Islamabad",
        preferredCurrency: "PKR",
        preferredLanguage: "ur",
        fitnessGoal: "muscle_building",
        fitnessExperience: "intermediate",
        activityLevel: "very_active",
        availableEquipment: ["dumbbells", "barbell", "bench"],
        dietaryPreferences: ["high_protein"],
        allergies: ["peanuts"],
        dietaryRestrictions: ["halal"],
      })
      .returning();
    console.log(`✓ PASS: User profile created with goal: ${profile.fitnessGoal}`);

    // Test 5: Profile Update (PATCH equivalent)
    console.log("[4] Testing Profile Updates...");
    const [updatedProfile] = await db
      .update(schema.userProfiles)
      .set({
        currentWeight: 80.0,
        fitnessGoal: "strength_improvement",
        updatedAt: new Date(),
      })
      .where(eq(schema.userProfiles.userId, newUser.id))
      .returning();

    if (
      updatedProfile.currentWeight === 80.0 &&
      updatedProfile.fitnessGoal === "strength_improvement"
    ) {
      console.log("✓ PASS: Profile weight and goal updated successfully.");
    } else {
      throw new Error("Profile update verification failed.");
    }

    // Test 6: Duplicate Email Constraint
    console.log("[5] Testing Duplicate Email Constraint...");
    let duplicateRejected = false;
    try {
      await db.insert(schema.users).values({
        name: "Duplicate User",
        email: testEmail, // same email
        passwordHash: hashed,
      });
    } catch (err) {
      duplicateRejected = true;
      console.log("✓ PASS: Duplicate email rejected by unique constraint.");
    }
    if (!duplicateRejected) {
      throw new Error("Duplicate email was not rejected!");
    }

    // Test 7: Cascade Delete
    console.log("[6] Testing Foreign Key Cascade Deletion...");
    await db.delete(schema.users).where(eq(schema.users.id, newUser.id));
    const [orphanProfile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, newUser.id));
    const [orphanSettings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, newUser.id));

    if (!orphanProfile && !orphanSettings) {
      console.log("✓ PASS: Cascade deletion wiped associated profile and settings.");
    } else {
      throw new Error("Cascade deletion failed!");
    }

    console.log("\nALL DATABASE, AUTH, AND PROFILE INTEGRITY TESTS PASSED SUCCESSFULLY! ✓");
  } finally {
    await client.end();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

