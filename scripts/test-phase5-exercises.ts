import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/db";
import { exercises, exerciseCategories, muscleGroups } from "../src/db/schema";
import { eq, or, ilike, and } from "drizzle-orm";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail || "");
    failed++;
  }
}

async function runPhase5Tests() {
  console.log("\n=======================================================");
  console.log("  FITLIFE AI: PHASE 5 EXERCISE LIBRARY & ANATOMY TESTS ");
  console.log("=======================================================\n");

  try {
    // -------------------------------------------------------------
    // GROUP 1: CATEGORIES & MUSCLE ANATOMY CATALOG
    // -------------------------------------------------------------
    console.log("[Group 1] Categories & Muscle Groups Catalog");
    const categories = await db.select().from(exerciseCategories);
    assert(categories.length >= 7, "Exercise categories seeded (7 categories)", { count: categories.length });

    const requiredCatSlugs = ["strength", "bodyweight", "cardio", "core", "flexibility", "mobility", "rehabilitation"];
    for (const slug of requiredCatSlugs) {
      const found = categories.find((c) => c.slug === slug);
      assert(!!found && found.nameUr.length > 0, `Category '${slug}' exists with Urdu localization`);
    }

    const muscles = await db.select().from(muscleGroups);
    assert(muscles.length >= 12, "Muscle groups seeded (12 muscle groups)", { count: muscles.length });

    const requiredMuscles = [
      "chest", "back", "shoulders", "biceps", "triceps",
      "forearms", "quadriceps", "hamstrings", "glutes",
      "calves", "abdominals", "full_body"
    ];
    for (const m of requiredMuscles) {
      const found = muscles.find((mg) => mg.slug === m);
      assert(!!found && !!found.svgId, `Muscle group '${m}' has valid SVG anatomical layer ID`);
    }

    // -------------------------------------------------------------
    // GROUP 2: EXERCISE LIBRARY DATASET & CORE MOVEMENTS
    // -------------------------------------------------------------
    console.log("\n[Group 2] Comprehensive Exercise Library Dataset (Requested Movements)");
    const allExercises = await db.select().from(exercises);
    assert(allExercises.length >= 24, "Exercise library populated with 24+ movements", { count: allExercises.length });

    const targetMovementSlugs = [
      // Chest
      "push-ups", "barbell-bench-press", "incline-dumbbell-press", "dumbbell-chest-fly",
      // Back
      "pull-ups", "lat-pulldown", "seated-cable-row", "one-arm-dumbbell-row",
      // Shoulders
      "dumbbell-shoulder-press", "dumbbell-lateral-raises", "dumbbell-front-raises", "reverse-fly",
      // Arms
      "dumbbell-bicep-curl", "hammer-curls", "tricep-pushdown", "overhead-tricep-extension",
      // Legs
      "barbell-squats", "walking-lunges", "leg-press", "leg-extensions", "romanian-deadlift", "lying-leg-curls", "standing-calf-raises",
      // Core
      "standard-plank", "floor-crunches", "lying-leg-raises", "bicycle-crunches",
      // Cardio
      "brisk-walking", "outdoor-jogging", "stationary-cycling", "jumping-jacks", "jump-rope",
      // Mobility & Flexibility
      "cat-cow-stretch", "kneeling-hip-flexor-stretch", "standing-hamstring-stretch", "shoulder-mobility-pass-through"
    ];

    for (const slug of targetMovementSlugs) {
      const found = allExercises.find((e) => e.slug === slug);
      assert(!!found, `Verified movement '${slug}' present in database`);
    }

    // -------------------------------------------------------------
    // GROUP 3: SEARCH BY ENGLISH AND URDU
    // -------------------------------------------------------------
    console.log("\n[Group 3] Search Capabilities (English & Urdu)");
    // Search English "Push-ups"
    const pushupSearch = await db
      .select()
      .from(exercises)
      .where(ilike(exercises.nameEn, "%push-up%"));
    assert(pushupSearch.length >= 1, "English search for 'push-up' returns results");

    // Search Urdu "بینچ پریس"
    const benchUrduSearch = await db
      .select()
      .from(exercises)
      .where(ilike(exercises.nameUr, "%بینچ پریس%"));
    assert(benchUrduSearch.length >= 1, "Urdu search for 'بینچ پریس' returns results");

    // Search Urdu "ڈنڈ" (Traditional Push-ups)
    const dundUrduSearch = await db
      .select()
      .from(exercises)
      .where(ilike(exercises.nameUr, "%ڈنڈ%"));
    assert(dundUrduSearch.length >= 1, "Urdu search for 'ڈنڈ' (Push-ups) returns results");

    // -------------------------------------------------------------
    // GROUP 4: FILTERING BY MUSCLE, EQUIPMENT, DIFFICULTY & BODYWEIGHT
    // -------------------------------------------------------------
    console.log("\n[Group 4] Filtering (Muscle, Equipment, Difficulty, Bodyweight)");
    // Filter by chest
    const chestExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.primaryMuscle, "chest"));
    assert(chestExercises.length >= 4, "Filtered by primary muscle 'chest' returns 4+ exercises");

    // Filter by bodyweight (no equipment)
    const bodyweightOnly = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.isBodyweight, true), eq(exercises.equipment, "none")));
    assert(bodyweightOnly.length >= 8, "Filtered by bodyweight & no equipment returns 8+ exercises");

    // Filter by beginner difficulty
    const beginnerExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.difficulty, "beginner"));
    assert(beginnerExercises.length >= 10, "Filtered by 'beginner' difficulty returns 10+ exercises");

    // Filter by dumbbells
    const dumbbellExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.equipment, "dumbbells"));
    assert(dumbbellExercises.length >= 6, "Filtered by 'dumbbells' returns 6+ exercises");

    // -------------------------------------------------------------
    // GROUP 5: DETAILED EXERCISE TECHNIQUE & ANATOMY CUES
    // -------------------------------------------------------------
    console.log("\n[Group 5] Detailed Technique, Safety, & Breathing Mechanics");
    const [sampleEx] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.slug, "barbell-squats"))
      .limit(1);

    assert(!!sampleEx, "Sample exercise 'barbell-squats' retrieved");
    assert(sampleEx.executionStepsEn.length >= 3, "Execution steps present in English", {
      steps: sampleEx.executionStepsEn.length,
    });
    assert(sampleEx.executionStepsUr.length >= 3, "Execution steps present in Urdu", {
      stepsUr: sampleEx.executionStepsUr.length,
    });
    assert(sampleEx.breathingPatternEn.length > 10, "Breathing pattern instructions defined");
    assert(sampleEx.safetyPrecautionsEn.length >= 1, "Safety precautions defined");
    assert(sampleEx.commonMistakesEn.length >= 1, "Common mistakes documented");
    assert(!!sampleEx.easierVariation, "Easier variation progression documented", {
      easier: sampleEx.easierVariation,
    });
    assert(!!sampleEx.harderVariation, "Harder variation progression documented", {
      harder: sampleEx.harderVariation,
    });

    // -------------------------------------------------------------
    // GROUP 6: MET & CALORIC BURN ESTIMATION
    // -------------------------------------------------------------
    console.log("\n[Group 6] MET & Caloric Expenditure Calibration");
    assert(
      typeof sampleEx.estimatedMetValue === "number" && sampleEx.estimatedMetValue > 0,
      "Valid Compendium of Physical Activities MET value assigned",
      { met: sampleEx.estimatedMetValue }
    );
    assert(
      typeof sampleEx.estimatedCaloriesPerMinute === "number" && sampleEx.estimatedCaloriesPerMinute > 0,
      "Reliable caloric burn estimate per minute calibrated (70kg standard)",
      { calPerMin: sampleEx.estimatedCaloriesPerMinute }
    );

    console.log("\n=======================================================");
    console.log(`  PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error("Test execution threw fatal error:", err);
    process.exit(1);
  }
}

runPhase5Tests();

