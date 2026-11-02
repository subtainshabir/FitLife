import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getOrCreateDailyLog,
  recalculateDailyLogTotals,
  logFoodItem,
  importPlannedMealsToDiary,
  logWater,
  getDailyWaterTotal,
  getDailySummary,
  calculateNutritionInsights,
} from "../src/lib/services/diary-service";
import { calculateFoodNutrition, type FoodNutritionBasics } from "../src/lib/services/nutrition-calculator";

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
  console.log("       FITLIFE AI PHASE 7: DAILY NUTRITION & CALORIE TRACKING TEST SUITE       ");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------------------
  // 1. NUTRITION SNAPSHOT & QUANTITY CONVERSIONS
  // -------------------------------------------------------------------------
  console.log("[1] Testing Nutrition Snapshot Calculations...");

  const eggFood: FoodNutritionBasics = {
    id: "egg-id",
    nameEn: "Farm Egg",
    nameUr: "فارمی انڈہ",
    defaultServingSize: 1,
    defaultServingUnit: "piece",
    servingWeightGrams: 50,
    caloriesPer100g: 155,
    proteinPer100g: 12.6,
    carbsPer100g: 1.1,
    fatPer100g: 10.6,
    fibrePer100g: 0,
  };

  // 2 eggs (100g) -> 155 kcal, 12.6g protein
  const eggSnapshot = calculateFoodNutrition(eggFood, 2, "piece");
  assert(eggSnapshot.weightGrams === 100, "2 eggs weigh exactly 100g", `Got: ${eggSnapshot.weightGrams}`);
  assert(eggSnapshot.calories === 155, "2 eggs provide 155 kcal", `Got: ${eggSnapshot.calories}`);
  assert(eggSnapshot.protein === 12.6, "2 eggs provide 12.6g protein", `Got: ${eggSnapshot.protein}`);

  // 200g Chicken Breast -> 330 kcal, 62g protein
  const chickenFood: FoodNutritionBasics = {
    id: "chicken-id",
    nameEn: "Chicken Breast (Boneless)",
    nameUr: "مرغی کا سینہ (بون لیس)",
    defaultServingSize: 100,
    defaultServingUnit: "g",
    servingWeightGrams: 100,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    fibrePer100g: 0,
  };
  const chickenSnapshot = calculateFoodNutrition(chickenFood, 200, "g");
  assert(chickenSnapshot.calories === 330, "200g chicken breast provides 330 kcal", `Got: ${chickenSnapshot.calories}`);
  assert(chickenSnapshot.protein === 62, "200g chicken breast provides 62g protein", `Got: ${chickenSnapshot.protein}`);

  // -------------------------------------------------------------------------
  // 2. DATABASE INTEGRATION & LOGGING LIFECYCLE
  // -------------------------------------------------------------------------
  console.log("\n[2] Testing PostgreSQL Phase 7 Database Operations...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // 2.1 Create test user
    const [testUser] = await db
      .insert(schema.users)
      .values({
        email: `diary_tester_${Date.now()}@fitlife.ai`,
        name: "Diary Tester",
        passwordHash: "$2a$12$dummyhashforfooddiary00000000000000000000000000",
      })
      .returning();

    assert(!!testUser.id, `Created test user for diary lifecycle (${testUser.id})`);

    const testDate = "2026-11-02";

    // 2.2 Get or create daily log container
    const dailyLog = await getOrCreateDailyLog(testUser.id, testDate);
    assert(dailyLog.userId === testUser.id, "Daily log container initialized for user");
    assert(dailyLog.logDate === testDate, `Daily log date matches (${testDate})`);
    assert(dailyLog.totalCalories === 0, "Initial daily log has 0 consumed calories");

    // Retrieve verified food from Phase 3 database
    const [dbEgg] = await db
      .select()
      .from(schema.foodItems)
      .where(eq(schema.foodItems.nameEn, "Eggs (Farm / White)"))
      .limit(1);

    const [dbChicken] = await db
      .select()
      .from(schema.foodItems)
      .where(eq(schema.foodItems.nameEn, "Chicken Breast (Boneless)"))
      .limit(1);

    assert(!!dbEgg, "Found 'Eggs (Farm / White)' in Phase 3 food database");
    assert(!!dbChicken, "Found 'Chicken Breast (Boneless)' in Phase 3 food database");

    // 2.3 Log Breakfast Food Item (2 eggs)
    const logRes1 = await logFoodItem({
      userId: testUser.id,
      logDate: testDate,
      foodItemId: dbEgg.id,
      mealCategory: "breakfast",
      foodNameEn: dbEgg.nameEn,
      foodNameUr: dbEgg.nameUr,
      quantity: 2,
      unit: "piece",
    });

    assert(logRes1.entry.calories === 143, "Logged breakfast item holds exact calorie snapshot (143 kcal)", `Got: ${logRes1.entry.calories}`);
    assert(logRes1.entry.proteinGrams === 12.6, "Logged breakfast item holds exact protein snapshot (12.6g)", `Got: ${logRes1.entry.proteinGrams}`);
    assert(logRes1.dailyLog.totalCalories === 143, "Daily log total calories updated to 143 kcal", `Got: ${logRes1.dailyLog.totalCalories}`);

    // 2.4 Log Lunch Food Item (150g chicken)
    const logRes2 = await logFoodItem({
      userId: testUser.id,
      logDate: testDate,
      foodItemId: dbChicken.id,
      mealCategory: "lunch",
      foodNameEn: dbChicken.nameEn,
      foodNameUr: dbChicken.nameUr,
      quantity: 150,
      unit: "g",
    });

    // 150g of raw chicken breast = 1.5 * 120 = 180 kcal, 1.5 * 22.5 = 33.8g protein
    assert(logRes2.entry.calories === 180, "Logged lunch item holds exact calorie snapshot (180 kcal)", `Got: ${logRes2.entry.calories}`);
    assert(logRes2.dailyLog.totalCalories === 323, "Daily log total calories accumulated (143 + 180 = 323 kcal)", `Got: ${logRes2.dailyLog.totalCalories}`);
    assert(logRes2.dailyLog.totalProteinGrams === 46.4, "Daily log total protein accumulated (12.6 + 33.8 = 46.4g)", `Got: ${logRes2.dailyLog.totalProteinGrams}`);

    // 2.5 Idempotency Test: Attempting to log duplicate item with same idempotency key
    const idempotencyKey = `import_test_item_${testDate}`;
    const firstLog = await logFoodItem({
      userId: testUser.id,
      logDate: testDate,
      foodItemId: dbEgg.id,
      mealCategory: "snack",
      foodNameEn: "Boiled Egg",
      quantity: 1,
      unit: "piece",
      idempotencyKey,
    });
    assert(firstLog.isDuplicateSkipped === false, "First insertion with idempotency key succeeds");

    const duplicateLog = await logFoodItem({
      userId: testUser.id,
      logDate: testDate,
      foodItemId: dbEgg.id,
      mealCategory: "snack",
      foodNameEn: "Boiled Egg",
      quantity: 1,
      unit: "piece",
      idempotencyKey,
    });
    assert(duplicateLog.isDuplicateSkipped === true, "Repeated insertion with same idempotency key is skipped (duplicate prevented)");
    assert(duplicateLog.entry.id === firstLog.entry.id, "Duplicate returns existing entry ID without creating duplicate record");

    // 2.6 Daily Summary Verification
    const summary = await getDailySummary(testUser.id, testDate);
    assert(summary.totals.calories > 0, "Daily summary returns positive calorie total");
    assert(summary.mealBreakdown.breakfast.itemsCount === 1, "Meal breakdown includes 1 breakfast item");
    assert(summary.mealBreakdown.lunch.itemsCount === 1, "Meal breakdown includes 1 lunch item");
    assert(summary.mealBreakdown.dinner.itemsCount === 0, "Dinner has 0 items (not yet logged)");

    // 2.7 Water Logging & Goal
    const waterRes1 = await logWater(testUser.id, 250, testDate);
    assert(waterRes1.entry.amountMl === 250, "Logged 250 ml glass of water");

    const waterRes2 = await logWater(testUser.id, 500, testDate);
    assert(waterRes2.dailyTotalMl === 750, "Water total aggregated (250 + 500 = 750 ml)", `Got: ${waterRes2.dailyTotalMl}`);

    const waterSum = await getDailyWaterTotal(testUser.id, testDate);
    assert(waterSum === 750, "getDailyWaterTotal returns 750 ml", `Got: ${waterSum}`);

    // 2.8 Deterministic Nutrition Insights
    const insights = await calculateNutritionInsights(testUser.id, testDate);
    assert(insights.length >= 2, `Generated ${insights.length} realistic insights for day`);
    const dinnerInsight = insights.find((i) => i.titleEn.includes("Dinner"));
    assert(!!dinnerInsight, "Generated insight highlighting unlogged dinner");

    // 2.9 Favourite Foods
    const [fav] = await db
      .insert(schema.favouriteFoods)
      .values({
        userId: testUser.id,
        foodItemId: dbChicken.id,
        customServingSize: 150,
        customServingUnit: "g",
      })
      .returning();

    assert(!!fav.id, "Saved chicken breast as favourite food");

    const userFavs = await db
      .select()
      .from(schema.favouriteFoods)
      .where(eq(schema.favouriteFoods.userId, testUser.id));
    assert(userFavs.length === 1, "User has 1 saved favourite food in database");

    // 2.10 Clean up test user
    await db.delete(schema.users).where(eq(schema.users.id, testUser.id));
    console.log("  ✓ Cleaned up test user and associated food log entries");
  } finally {
    await sql.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`TOTAL PHASE 7 TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
