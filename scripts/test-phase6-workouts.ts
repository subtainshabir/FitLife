import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  calculateSetVolume,
  calculateSessionSummary,
  evaluateProgressiveOverload,
  evaluateAndSavePersonalRecords,
  checkMuscleRecovery,
} from "../src/lib/services/workout-service";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

async function runTests() {
  console.log("===============================================================================");
  console.log("       FITLIFE AI PHASE 6: WORKOUT PLANNER & OVERLOAD TEST SUITE               ");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------------------
  // 1. DETERMINISTIC VOLUME CALCULATIONS
  // -------------------------------------------------------------------------
  console.log("[1] Testing Volume Calculation Math...");

  // Weighted resistance set: 80 kg * 10 reps = 800 kg
  const vol1 = calculateSetVolume(80, 10, false, 75);
  assert(vol1 === 800, "Standard weighted set volume (80kg * 10 reps = 800kg)", `Got: ${vol1}`);

  // Weighted resistance set with fractional weight: 22.5 kg * 8 reps = 180 kg
  const vol2 = calculateSetVolume(22.5, 8, false);
  assert(vol2 === 180, "Fractional weight volume (22.5kg * 8 reps = 180kg)", `Got: ${vol2}`);

  // Bodyweight set: 0 kg external weight, 70kg user, 10 reps. Biomechanical 65% = 45.5kg * 10 = 455kg
  const vol3 = calculateSetVolume(0, 10, true, 70);
  assert(vol3 === 455, "Bodyweight resistance set with known user weight (70kg * 0.65 * 10 = 455kg)", `Got: ${vol3}`);

  // Bodyweight set fallback: 0 kg external weight, unspecified user weight (defaults to 65kg * 0.65 = 42.25 * 10 = 422.5kg)
  const vol4 = calculateSetVolume(0, 10, true);
  assert(vol4 === 422.5, "Bodyweight set with default reference weight (65kg * 0.65 * 10 = 422.5kg)", `Got: ${vol4}`);

  // Zero reps completed -> 0 volume
  const vol5 = calculateSetVolume(100, 0, false);
  assert(vol5 === 0, "Zero reps completed returns 0 volume", `Got: ${vol5}`);

  // Session summary calculation
  const mockSets = [
    { weightKg: 50, repsCompleted: 10, isCompleted: true, isWarmup: false },
    { weightKg: 50, repsCompleted: 10, isCompleted: true, isWarmup: false },
    { weightKg: 50, repsCompleted: 8, isCompleted: true, isWarmup: false },
    { weightKg: 60, repsCompleted: 0, isCompleted: false, isWarmup: false }, // uncompleted
    { weightKg: 20, repsCompleted: 15, isCompleted: true, isWarmup: true },  // warmup
  ];
  const summary = calculateSessionSummary(mockSets);
  // (50*10) + (50*10) + (50*8) + (20*15) = 500 + 500 + 400 + 300 = 1700 kg
  assert(summary.totalVolumeKg === 1700, "Session total volume includes completed working and warmup sets", `Got: ${summary.totalVolumeKg}`);
  assert(summary.totalSetsCompleted === 4, "Total sets completed counts completed sets only (4/5)", `Got: ${summary.totalSetsCompleted}`);
  assert(summary.totalRepsCompleted === 43, "Total reps completed sum is accurate (10+10+8+15 = 43)", `Got: ${summary.totalRepsCompleted}`);

  // -------------------------------------------------------------------------
  // 2. PROGRESSIVE OVERLOAD RECOMMENDATION ENGINE
  // -------------------------------------------------------------------------
  console.log("\n[2] Testing Progressive Overload Advice Engine...");

  // Scenario A: Upper body weighted - User achieved max target reps (12 on all sets) -> +2.5 kg
  const adviceUpper = evaluateProgressiveOverload({
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeightKg: 40,
    primaryMuscle: "chest",
    isBodyweight: false,
    loggedSets: [
      { weightKg: 40, repsCompleted: 12, isCompleted: true },
      { weightKg: 40, repsCompleted: 12, isCompleted: true },
      { weightKg: 40, repsCompleted: 12, isCompleted: true },
    ],
  });
  assert(adviceUpper.action === "increase_weight", "Upper body all max reps triggers 'increase_weight'", `Got: ${adviceUpper.action}`);
  assert(adviceUpper.suggestedWeightKg === 42.5, "Upper body weight increment is conservative +2.5 kg (40 -> 42.5)", `Got: ${adviceUpper.suggestedWeightKg}`);
  assert(adviceUpper.headlineUr.includes("اضافہ"), "Urdu headline contains Urdu progression phrasing", adviceUpper.headlineUr);

  // Scenario B: Lower body weighted - User achieved max target reps (10 on all sets) -> +5.0 kg
  const adviceLower = evaluateProgressiveOverload({
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 60,
    primaryMuscle: "quadriceps",
    isBodyweight: false,
    loggedSets: [
      { weightKg: 60, repsCompleted: 10, isCompleted: true },
      { weightKg: 60, repsCompleted: 10, isCompleted: true },
      { weightKg: 60, repsCompleted: 10, isCompleted: true },
    ],
  });
  assert(adviceLower.action === "increase_weight", "Lower body all max reps triggers 'increase_weight'", `Got: ${adviceLower.action}`);
  assert(adviceLower.suggestedWeightKg === 65, "Lower body weight increment is conservative +5.0 kg (60 -> 65)", `Got: ${adviceLower.suggestedWeightKg}`);

  // Scenario C: Bodyweight exercise - User achieved max target reps -> +2 reps target
  const adviceBodyweight = evaluateProgressiveOverload({
    targetRepsMin: 10,
    targetRepsMax: 15,
    targetWeightKg: 0,
    primaryMuscle: "chest",
    isBodyweight: true,
    loggedSets: [
      { weightKg: 0, repsCompleted: 15, isCompleted: true },
      { weightKg: 0, repsCompleted: 15, isCompleted: true },
      { weightKg: 0, repsCompleted: 15, isCompleted: true },
    ],
  });
  assert(adviceBodyweight.action === "increase_reps", "Bodyweight max reps triggers 'increase_reps'", `Got: ${adviceBodyweight.action}`);
  assert(adviceBodyweight.suggestedRepsMax === 17, "Bodyweight reps increment adds +2 reps (15 -> 17)", `Got: ${adviceBodyweight.suggestedRepsMax}`);

  // Scenario D: User completed below min target reps -> recommend maintain
  const adviceMaintain = evaluateProgressiveOverload({
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeightKg: 50,
    primaryMuscle: "chest",
    isBodyweight: false,
    loggedSets: [
      { weightKg: 50, repsCompleted: 6, isCompleted: true },
      { weightKg: 50, repsCompleted: 6, isCompleted: true },
      { weightKg: 50, repsCompleted: 5, isCompleted: true },
    ],
  });
  assert(adviceMaintain.action === "maintain", "Sub-target reps recommendation advises maintaining load", `Got: ${adviceMaintain.action}`);
  assert(adviceMaintain.suggestedWeightKg === 50, "Maintains current 50 kg without dangerous premature weight jumps", `Got: ${adviceMaintain.suggestedWeightKg}`);

  // -------------------------------------------------------------------------
  // 3. DATABASE INTEGRATION TESTS
  // -------------------------------------------------------------------------
  console.log("\n[3] Testing PostgreSQL Phase 6 Database State...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // 3.1 Check Pre-built Workout Routine Templates
    const templates = await db
      .select()
      .from(schema.workoutRoutines)
      .where(eq(schema.workoutRoutines.isTemplate, true));

    assert(templates.length >= 4, `Database contains seeded workout templates (found ${templates.length} >= 4)`);

    const fullBodyTpl = templates.find((t) => t.name === "Full Body Foundations");
    assert(!!fullBodyTpl, "Found 'Full Body Foundations' template in DB");

    if (fullBodyTpl) {
      // Check linked routine exercises
      const tplExs = await db
        .select()
        .from(schema.routineExercises)
        .where(eq(schema.routineExercises.routineId, fullBodyTpl.id));

      assert(tplExs.length === 5, `'Full Body Foundations' has exactly 5 configured exercises (found ${tplExs.length})`);
    }

    // 3.2 Create Test User & Session Workflow
    const [testUser] = await db
      .insert(schema.users)
      .values({
        email: `workout_tester_${Date.now()}@fitlife.ai`,
        name: "Workout Tester",
        passwordHash: "$2a$12$dummyhashforworkoutsessions000000000000000000000",
      })
      .returning();

    assert(!!testUser.id, `Created test user for session lifecycle test (${testUser.id})`);

    // Fetch an exercise to link
    const [benchPress] = await db
      .select()
      .from(schema.exercises)
      .where(eq(schema.exercises.slug, "barbell-bench-press"))
      .limit(1);

    assert(!!benchPress, "Found 'barbell-bench-press' in exercise library");

    // Start workout session
    const [session] = await db
      .insert(schema.workoutSessions)
      .values({
        userId: testUser.id,
        name: "Test Push Workout",
        status: "in_progress",
        startTime: new Date(),
      })
      .returning();

    assert(session.status === "in_progress", "Started new session with status 'in_progress'");

    // Insert session exercise
    const [se] = await db
      .insert(schema.sessionExercises)
      .values({
        sessionId: session.id,
        exerciseId: benchPress.id,
        orderIndex: 0,
      })
      .returning();

    assert(!!se.id, "Session exercise created and linked to session");

    // Evaluate Personal Records on set 1: 60 kg x 10 reps
    const prs1 = await evaluateAndSavePersonalRecords(
      testUser.id,
      benchPress.id,
      [
        { weightKg: 60, repsCompleted: 10, isCompleted: true, isWarmup: false },
      ],
      session.id,
      75
    );

    assert(prs1.length >= 2, `Initial workout creates PRs for max_weight and max_reps (achieved ${prs1.length})`);

    // Check PRs stored in database
    const savedPrs = await db
      .select()
      .from(schema.personalRecords)
      .where(
        and(
          eq(schema.personalRecords.userId, testUser.id),
          eq(schema.personalRecords.exerciseId, benchPress.id)
        )
      );

    const weightPr = savedPrs.find((p) => p.recordType === "max_weight");
    assert(weightPr?.value === 60, "Stored max_weight PR value is 60 kg", `Got: ${weightPr?.value}`);

    // Log a new higher set: 65 kg x 8 reps -> Should break previous max_weight PR!
    const prs2 = await evaluateAndSavePersonalRecords(
      testUser.id,
      benchPress.id,
      [
        { weightKg: 65, repsCompleted: 8, isCompleted: true, isWarmup: false },
      ],
      session.id,
      75
    );

    const brokenPr = prs2.find((p) => p.recordType === "max_weight");
    assert(brokenPr?.value === 65 && brokenPr?.previousValue === 60, "New PR correctly registers new value (65kg) and records previous value (60kg)", `Val: ${brokenPr?.value}, Prev: ${brokenPr?.previousValue}`);

    // Complete session
    await db
      .update(schema.workoutSessions)
      .set({
        status: "completed",
        endTime: new Date(),
        durationSeconds: 2400,
        totalVolumeKg: 1120,
        totalSetsCompleted: 3,
        totalRepsCompleted: 24,
      })
      .where(eq(schema.workoutSessions.id, session.id));

    // 3.3 Muscle Recovery Check
    const recovery = await checkMuscleRecovery(testUser.id, ["chest", "back"]);
    assert(recovery.hasFatiguedMuscles === true, "checkMuscleRecovery detects chest fatigue within 48h");
    assert(recovery.fatiguedMuscles.some((m) => m.muscle === "chest"), "Fatigued muscles list includes 'chest'");
    assert(!!recovery.warningEn && !!recovery.warningUr, "Recovery notice includes localized English and Urdu messages");

    // Clean up test user (cascades to sessions, session_exercises, sets, personal_records)
    await db.delete(schema.users).where(eq(schema.users.id, testUser.id));
    console.log("  ✓ Cleaned up test user and associated workout records");
  } finally {
    await sql.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`TOTAL PHASE 6 TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();

