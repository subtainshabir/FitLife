import {
  generateNutritionPlanSchema,
  regenerateMealSchema,
  substituteFoodSchema,
  updateGroceryItemSchema,
  updateNutritionPlanSchema,
} from "../src/lib/validations/nutrition-plan";

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

console.log("\n=======================================================");
console.log("  FITLIFE AI: PHASE 4 API & VALIDATION SCHEMA TESTS    ");
console.log("=======================================================\n");

// 1. generateNutritionPlanSchema tests
console.log("[Test 1] generateNutritionPlanSchema Validation");
const validPlanInput = {
  name: "Rawalpindi Muscle Builder",
  goal: "muscle_building",
  targetCalories: 2500,
  targetProteinGrams: 160,
  targetCarbsGrams: 300,
  targetFatGrams: 75,
  targetFibreGrams: 30,
  dailyBudget: 600,
  city: "Rawalpindi",
  mealsPerDay: 4,
  cookingTimeMinutes: 30,
  dietaryType: "standard",
};

const v1 = generateNutritionPlanSchema.safeParse(validPlanInput);
assert(v1.success, "Valid plan generation input accepted");

const invalidPlanInput = {
  targetCalories: 400, // below 1000 min
  targetProteinGrams: 10, // below 30 min
  dailyBudget: 20, // below 100 min
  mealsPerDay: 8, // above 6 max
};
const inv1 = generateNutritionPlanSchema.safeParse(invalidPlanInput);
assert(!inv1.success, "Invalid calorie/budget/meal inputs properly rejected");

// 2. regenerateMealSchema tests
console.log("\n[Test 2] regenerateMealSchema Validation");
const validRegen = {
  mealId: "123e4567-e89b-12d3-a456-426614174000",
  preference: "cheaper",
};
assert(regenerateMealSchema.safeParse(validRegen).success, "Valid meal regeneration accepted");

const invalidRegen = {
  mealId: "not-a-uuid",
  preference: "unknown_pref",
};
assert(!regenerateMealSchema.safeParse(invalidRegen).success, "Invalid UUID & preference rejected");

// 3. substituteFoodSchema tests
console.log("\n[Test 3] substituteFoodSchema Validation");
const validSub = {
  mealId: "123e4567-e89b-12d3-a456-426614174000",
  mealFoodItemId: "123e4567-e89b-12d3-a456-426614174001",
  strategy: "cheaper",
};
assert(substituteFoodSchema.safeParse(validSub).success, "Valid substitution input accepted");

// 4. updateGroceryItemSchema tests
console.log("\n[Test 4] updateGroceryItemSchema Validation");
const validGrocery = {
  isPurchased: true,
  totalQuantity: 2.5,
  notes: "Bought from Raja Bazaar",
};
assert(updateGroceryItemSchema.safeParse(validGrocery).success, "Valid grocery item update accepted");

const invalidGrocery = {
  totalQuantity: -5,
};
assert(!updateGroceryItemSchema.safeParse(invalidGrocery).success, "Negative quantity rejected");

console.log("\n=======================================================");
console.log(`  VALIDATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) process.exit(1);
process.exit(0);

