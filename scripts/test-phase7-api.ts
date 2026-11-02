import {
  createFoodLogEntrySchema,
  updateFoodLogEntrySchema,
  importMealPlanSchema,
  logWaterSchema,
  updateWaterGoalSchema,
  favouriteFoodSchema,
  savedMealSchema,
} from "../src/lib/validations/diary";

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

console.log("===============================================================================");
console.log("       FITLIFE AI PHASE 7: DIARY & NUTRITION API VALIDATION TESTS             ");
console.log("===============================================================================\n");

// 1. Create Food Log Entry Schema
console.log("[1] Testing createFoodLogEntrySchema...");
const validEntry = {
  logDate: "2026-11-02",
  mealCategory: "breakfast",
  foodNameEn: "Boiled Eggs",
  foodNameUr: "ابلے ہوئے انڈے",
  quantity: 2,
  unit: "piece",
};
const res1 = createFoodLogEntrySchema.safeParse(validEntry);
assert(res1.success === true, "Valid food log entry passes validation");

const invalidCat = { ...validEntry, mealCategory: "midnight_snacking" };
const res2 = createFoodLogEntrySchema.safeParse(invalidCat);
assert(res2.success === false, "Invalid meal category is rejected");

const zeroQty = { ...validEntry, quantity: 0 };
const res3 = createFoodLogEntrySchema.safeParse(zeroQty);
assert(res3.success === false, "Zero quantity is rejected");

const negativeQty = { ...validEntry, quantity: -2 };
const res4 = createFoodLogEntrySchema.safeParse(negativeQty);
assert(res4.success === false, "Negative quantity is rejected");

const badDate = { ...validEntry, logDate: "02-11-2026" };
const res5 = createFoodLogEntrySchema.safeParse(badDate);
assert(res5.success === false, "Invalid date format (must be YYYY-MM-DD) is rejected");

// 2. Update Food Log Entry Schema
console.log("\n[2] Testing updateFoodLogEntrySchema...");
const updateRes1 = updateFoodLogEntrySchema.safeParse({ quantity: 3, unit: "piece" });
assert(updateRes1.success === true, "Valid update payload passes");

const updateRes2 = updateFoodLogEntrySchema.safeParse({ quantity: -1 });
assert(updateRes2.success === false, "Negative quantity in update is rejected");

// 3. Import Meal Plan Schema
console.log("\n[3] Testing importMealPlanSchema...");
const validImport = {
  date: "2026-11-02",
  nutritionPlanId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  confirmConsumed: true,
};
const importRes1 = importMealPlanSchema.safeParse(validImport);
assert(importRes1.success === true, "Valid meal plan import payload passes");

const badDateImport = { ...validImport, date: "not-a-date" };
const importRes2 = importMealPlanSchema.safeParse(badDateImport);
assert(importRes2.success === false, "Malformed import date is rejected");

// 4. Water Logging Schema
console.log("\n[4] Testing logWaterSchema & updateWaterGoalSchema...");
const validWater = { amountMl: 250, date: "2026-11-02" };
const waterRes1 = logWaterSchema.safeParse(validWater);
assert(waterRes1.success === true, "Valid water log (250ml) passes");

const zeroWater = { amountMl: 0 };
const waterRes2 = logWaterSchema.safeParse(zeroWater);
assert(waterRes2.success === false, "Zero water amount is rejected");

const excessiveWater = { amountMl: 50000 };
const waterRes3 = logWaterSchema.safeParse(excessiveWater);
assert(waterRes3.success === false, "Excessive water amount (>10,000ml) is rejected");

const validWaterGoal = { dailyTargetMl: 3000, containerSizeMl: 500 };
const goalRes1 = updateWaterGoalSchema.safeParse(validWaterGoal);
assert(goalRes1.success === true, "Valid water target goal (3000ml) passes");

const lowWaterGoal = { dailyTargetMl: 200 };
const goalRes2 = updateWaterGoalSchema.safeParse(lowWaterGoal);
assert(goalRes2.success === false, "Water target below 500ml is rejected");

// 5. Favourite Food Schema
console.log("\n[5] Testing favouriteFoodSchema...");
const validFav = {
  foodItemId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  customServingSize: 100,
  customServingUnit: "g",
};
const favRes1 = favouriteFoodSchema.safeParse(validFav);
assert(favRes1.success === true, "Valid favourite food passes");

const invalidFavId = { foodItemId: "not-uuid" };
const favRes2 = favouriteFoodSchema.safeParse(invalidFavId);
assert(favRes2.success === false, "Invalid non-UUID foodItemId is rejected");

// 6. Saved Meal Schema
console.log("\n[6] Testing savedMealSchema...");
const validSavedMeal = {
  name: "High Protein Lunch",
  nameUr: "ہائی پروٹین لنچ",
  mealCategory: "lunch",
  items: [
    { nameEn: "Chicken Breast", quantity: 150, unit: "g" },
    { nameEn: "Cooked Brown Rice", quantity: 1, unit: "cup" },
  ],
};
const savedRes1 = savedMealSchema.safeParse(validSavedMeal);
assert(savedRes1.success === true, "Valid saved meal passes validation");

const emptySavedMeal = { ...validSavedMeal, items: [] };
const savedRes2 = savedMealSchema.safeParse(emptySavedMeal);
assert(savedRes2.success === false, "Saved meal with empty items array is rejected");

console.log("\n===============================================================================");
console.log(`TOTAL PHASE 7 API TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
console.log("===============================================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
