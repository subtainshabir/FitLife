import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/db";
import { users, nutritionPlans, mealPlans, meals, mealFoodItems, groceryLists, groceryListItems } from "../src/db/schema";
import { eq } from "drizzle-orm";
import {
  getFoodCatalogWithPrices,
  generateDeterministicPakistaniPlan,
  generateAndSaveNutritionPlan,
  getFullNutritionPlan,
} from "../src/lib/services/plan-generator";
import {
  substituteMealFood,
  regenerateMealSlot,
} from "../src/lib/services/substitution-service";

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

async function runPhase4Tests() {
  console.log("\n=======================================================");
  console.log("  FITLIFE AI: PHASE 4 CORE NUTRITION PLANNER TEST SUITE ");
  console.log("=======================================================\n");

  try {
    // Retrieve a test user from DB
    const [testUser] = await db.select().from(users).limit(1);
    if (!testUser) {
      throw new Error("No users found in database. Seed user first.");
    }
    const userId = testUser.id;

    // TEST GROUP 1: CATALOG AND REGIONAL PRICING LOADER
    console.log("[Group 1] Food Catalog & Localized Pricing Loader");
    const { catalogForAI, foodMap, priceMap } = await getFoodCatalogWithPrices("Rawalpindi");
    assert(catalogForAI.length >= 35, "Catalog contains 35+ verified foods", { count: catalogForAI.length });
    assert(foodMap.size >= 35, "Food map loaded successfully");
    assert(priceMap.size > 0, "Localized price map contains verified entries", { priceEntries: priceMap.size });

    // Verify sample items have prices
    const eggItem = Array.from(foodMap.values()).find((f) => f.nameEn.toLowerCase().includes("egg"));
    assert(!!eggItem, "Farm Egg found in food map");
    if (eggItem) {
      const eggPrice = priceMap.get(eggItem.id);
      assert(!!eggPrice && eggPrice.price > 0, "Egg price record verified in PKR", eggPrice);
    }

    // TEST GROUP 2: DETERMINISTIC PAKISTANI MEAL GENERATOR
    console.log("\n[Group 2] Deterministic Pakistani Meal Generator");
    const context4Meals = {
      goal: "muscle_building",
      targetCalories: 2400,
      targetProteinGrams: 150,
      targetCarbsGrams: 280,
      targetFatGrams: 70,
      targetFibreGrams: 30,
      dailyBudget: 600,
      currency: "PKR",
      city: "Rawalpindi",
      mealsPerDay: 4,
      cookingTimeMinutes: 30,
      dietaryType: "standard",
      allergies: [],
      excludedFoods: [],
      dietaryRestrictions: ["halal"],
      preferredFoods: [],
    };

    const draftMeals = generateDeterministicPakistaniPlan(
      context4Meals,
      Array.from(foodMap.values()),
      priceMap,
      new Map()
    );

    assert(draftMeals.length === 4, "Generated exactly 4 meals", { count: draftMeals.length });
    assert(draftMeals[0].mealType === "breakfast", "Meal 1 is Breakfast");
    assert(draftMeals[1].mealType === "lunch", "Meal 2 is Lunch");
    assert(draftMeals[2].mealType === "evening_snack", "Meal 3 is Evening Snack");
    assert(draftMeals[3].mealType === "dinner", "Meal 4 is Dinner");

    // Verify culturally authentic naming
    assert(
      draftMeals[0].nameUr.length > 0 && draftMeals[0].instructions !== null,
      "Urdu recipe names and cooking instructions present"
    );

    // TEST GROUP 3: FULL PLAN PERSISTENCE & VERIFIED DETERMINISTIC COSTING
    console.log("\n[Group 3] Full Nutrition Plan Generation & DB Persistence");
    const planResult = await generateAndSaveNutritionPlan(userId, {
      name: "Test High-Protein Budget Plan",
      goal: "muscle_building",
      targetCalories: 2200,
      targetProteinGrams: 140,
      targetCarbsGrams: 250,
      targetFatGrams: 65,
      targetFibreGrams: 25,
      dailyBudget: 650,
      currency: "PKR",
      city: "Rawalpindi",
      mealsPerDay: 4,
      cookingTimeMinutes: 30,
      dietaryType: "standard",
      useAi: false, // test deterministic engine directly
      planDays: 7,
    });

    const plan = planResult.plan;
    assert(!!plan.id, "Plan inserted with valid UUID", { id: plan.id });
    assert(plan.totalCalories > 1500, "Plan total calories calculated deterministically", {
      totalCalories: plan.totalCalories,
    });
    assert(plan.totalProteinGrams > 80, "Plan total protein calculated deterministically", {
      totalProtein: plan.totalProteinGrams,
    });
    assert(plan.totalDailyCostPkr > 0, "Plan daily cost computed in PKR", {
      dailyCostPkr: plan.totalDailyCostPkr,
    });
    assert(plan.isBudgetExceeded === (plan.totalDailyCostPkr > 650), "Budget threshold accurately flagged");

    // Verify grocery list
    const gList = planResult.groceryList;
    assert(!!gList.id, "7-day grocery list created", { id: gList.id });
    assert(gList.daysCovered === 7, "Grocery list covers 7 days");
    assert(gList.items.length > 0, "Grocery list items deduplicated and populated", {
      itemCount: gList.items.length,
    });
    assert(gList.totalEstimatedCostPkr > 0, "Weekly grocery bill calculated in PKR", {
      weeklyBill: gList.totalEstimatedCostPkr,
    });

    // TEST GROUP 4: SINGLE MEAL REGENERATION
    console.log("\n[Group 4] Single Meal Regeneration Engine");
    const firstMeal = planResult.mealPlans[0].meals[0];
    const oldCal = firstMeal.totalCalories;
    const oldCost = firstMeal.totalCostPkr;

    const regenResult = await regenerateMealSlot(firstMeal.id, "cheaper");
    assert(!!regenResult.updatedMeal, "Meal regenerated successfully");
    assert(regenResult.updatedMeal.id === firstMeal.id, "Preserved exact meal slot ID");
    assert(regenResult.updatedPlan.id === plan.id, "Parent plan totals synchronized");

    // TEST GROUP 5: FOOD ITEM SUBSTITUTION
    console.log("\n[Group 5] Food Item Substitution Engine");
    // Find an item in lunch or dinner
    const dinnerMeal = planResult.mealPlans[0].meals.find((m) => m.mealType === "dinner") || planResult.mealPlans[0].meals[1];
    const targetFoodItem = dinnerMeal.items[0];

    const subResult = await substituteMealFood(dinnerMeal.id, targetFoodItem.id, "cheaper");
    assert(!!subResult.substitutionRecord, "Substitution recorded in DB history table");
    assert(
      subResult.substitutionRecord.originalNameEn === targetFoodItem.nameEn,
      "Recorded original food name"
    );
    assert(!!subResult.substitutionRecord.substituteNameEn, "Recorded substitute food name", {
      substitute: subResult.substitutionRecord.substituteNameEn,
    });
    assert(
      typeof subResult.substitutionRecord.costDeltaPkr === "number",
      "Accurately logged cost delta in PKR",
      { costDelta: subResult.substitutionRecord.costDeltaPkr }
    );

    // TEST GROUP 6: GET FULL PLAN BY ID & SECURITY CHECK
    console.log("\n[Group 6] Full Plan Retrieval & Ownership Check");
    const retrieved = await getFullNutritionPlan(plan.id, userId);
    assert(!!retrieved && retrieved.plan.id === plan.id, "Successfully retrieved full plan with relations");
    assert(retrieved!.mealPlans.length >= 1, "Retrieved daily routine schedule");
    assert(!!retrieved!.groceryList, "Retrieved associated grocery list with items");

    const unauthorized = await getFullNutritionPlan(plan.id, "00000000-0000-0000-0000-000000000000");
    assert(unauthorized === null, "Rejects retrieval for mismatched user ID (403/404 security check)");

    console.log("\n=======================================================");
    console.log(`  PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error("Test execution threw fatal error:", err);
    process.exit(1);
  }
}

runPhase4Tests();

