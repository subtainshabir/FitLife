import {
  convertToGrams,
  calculateFoodNutrition,
  calculateFoodCost,
  rankProteinCostEfficiency,
} from "../src/lib/services/nutrition-calculator";

console.log("=== FITLIFE AI: PHASE 3 NUTRITION & COST CALCULATOR UNIT TESTS ===\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, details?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName} - ${details || ""}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Serving Unit to Grams Conversion
// ---------------------------------------------------------------------------
console.log("[1] Unit to Grams Conversion Tests...");

// kg -> g
const gFromKg = convertToGrams({ nameEn: "Chicken" }, 1.5, "kg");
assert(gFromKg === 1500, "1.5 kg converted to 1500g", `Got ${gFromKg}`);

// pieces of eggs (50g each)
const eggsGrams = convertToGrams({ nameEn: "Eggs (Farm / White)", servingWeightGrams: 50 }, 3, "piece");
assert(eggsGrams === 150, "3 eggs converted to 150g", `Got ${eggsGrams}`);

// pieces of bananas (118g each)
const bananaGrams = convertToGrams({ nameEn: "Bananas (Kela)", servingWeightGrams: 118 }, 2, "piece");
assert(bananaGrams === 236, "2 bananas converted to 236g", `Got ${bananaGrams}`);

// dozen of eggs
const dozenEggs = convertToGrams({ nameEn: "Eggs (Farm)", servingWeightGrams: 50 }, 1, "dozen");
assert(dozenEggs === 600, "1 dozen eggs converted to 600g (12 * 50g)", `Got ${dozenEggs}`);

// cup of cooked rice (158g)
const riceCup = convertToGrams({ nameEn: "Basmati Rice (Cooked / Boiled)" }, 1, "cup");
assert(riceCup === 158, "1 cup cooked rice converted to 158g", `Got ${riceCup}`);

// cup of oats (80g)
const oatsCup = convertToGrams({ nameEn: "Oats / Dalia (Dry Rolled)" }, 1, "cup");
assert(oatsCup === 80, "1 cup rolled oats converted to 80g", `Got ${oatsCup}`);

// tablespoons of peanut butter (16g each)
const pbTbsp = convertToGrams({ nameEn: "Natural Peanut Butter" }, 2, "tbsp");
assert(pbTbsp === 32, "2 tbsp peanut butter converted to 32g", `Got ${pbTbsp}`);

// ml of milk
const milkMl = convertToGrams({ nameEn: "Whole Buffalo / Cow Milk" }, 250, "ml");
assert(Math.abs(milkMl - 257.5) < 1.0, "250 ml milk density adjusted to ~257.5g", `Got ${milkMl}`);

// ---------------------------------------------------------------------------
// 2. Nutrition Macro Calculations
// ---------------------------------------------------------------------------
console.log("\n[2] Nutrition Calculations for Quantities...");

const chickenItem = {
  id: "test-chicken",
  nameEn: "Chicken Breast (Boneless)",
  nameUr: "چکن بون لیس بریسٹ",
  defaultServingSize: 150,
  defaultServingUnit: "g",
  servingWeightGrams: 150,
  caloriesPer100g: 120,
  proteinPer100g: 22.5,
  carbsPer100g: 0,
  fatPer100g: 2.6,
  fibrePer100g: 0,
};

// 250g of chicken breast: 120 * 2.5 = 300 kcal, 22.5 * 2.5 = 56.3g protein, 2.6 * 2.5 = 6.5g fat
const chickenNutrition = calculateFoodNutrition(chickenItem, 250, "g");
assert(chickenNutrition.weightGrams === 250, "Weight is 250g");
assert(chickenNutrition.calories === 300, "Calories = 300 kcal", `Got ${chickenNutrition.calories}`);
assert(chickenNutrition.protein === 56.3, "Protein = 56.3g", `Got ${chickenNutrition.protein}`);
assert(chickenNutrition.fat === 6.5, "Fat = 6.5g", `Got ${chickenNutrition.fat}`);
assert(chickenNutrition.carbs === 0, "Carbs = 0g");

// 2 hard boiled eggs (50g each = 100g total)
const eggItem = {
  id: "test-egg",
  nameEn: "Boiled Eggs (Hard Boiled)",
  nameUr: "ابلے ہوئے انڈے",
  defaultServingSize: 1,
  defaultServingUnit: "piece",
  servingWeightGrams: 50,
  caloriesPer100g: 155,
  proteinPer100g: 12.6,
  carbsPer100g: 1.1,
  fatPer100g: 10.6,
  fibrePer100g: 0,
};

const eggNutrition = calculateFoodNutrition(eggItem, 2, "piece");
assert(eggNutrition.weightGrams === 100, "2 eggs weigh 100g", `Got ${eggNutrition.weightGrams}`);
assert(eggNutrition.calories === 155, "2 eggs = 155 kcal", `Got ${eggNutrition.calories}`);
assert(eggNutrition.protein === 12.6, "2 eggs = 12.6g protein", `Got ${eggNutrition.protein}`);

// 1 cup cooked daal chana (200g)
const daalItem = {
  id: "test-daal",
  nameEn: "Daal Chana (Cooked / Boiled)",
  nameUr: "پکی ہوئی دال چنا",
  defaultServingSize: 1,
  defaultServingUnit: "cup",
  servingWeightGrams: 200,
  caloriesPer100g: 164,
  proteinPer100g: 8.9,
  carbsPer100g: 27.4,
  fatPer100g: 2.6,
  fibrePer100g: 7.6,
};

const daalNutrition = calculateFoodNutrition(daalItem, 1, "cup");
assert(daalNutrition.weightGrams === 200, "1 cup cooked daal weighs 200g", `Got ${daalNutrition.weightGrams}`);
assert(daalNutrition.calories === 328, "1 cup daal = 328 kcal (164 * 2)", `Got ${daalNutrition.calories}`);
assert(daalNutrition.protein === 17.8, "1 cup daal = 17.8g protein (8.9 * 2)", `Got ${daalNutrition.protein}`);
assert(daalNutrition.fibre === 15.2, "1 cup daal = 15.2g fibre (7.6 * 2)", `Got ${daalNutrition.fibre}`);

// ---------------------------------------------------------------------------
// 3. Local Food Cost Calculations
// ---------------------------------------------------------------------------
console.log("\n[3] Food Cost Calculations for Pakistani Cities...");

// Chicken breast in Rawalpindi: PKR 680 per kg.
// 250g should cost: (250 / 1000) * 680 = PKR 170.
const chickenPrice = {
  id: "p1",
  city: "Rawalpindi",
  marketRetailer: "Barni Road Poultry",
  price: 680,
  quantity: 1,
  unit: "kg",
  pricePerStandardUnit: 680,
  standardUnit: "kg",
  currency: "PKR",
  verificationStatus: "verified",
  confidenceLevel: "high",
  collectionDate: new Date(),
};

const chickenCost = calculateFoodCost(chickenItem, 250, "g", chickenPrice);
assert(chickenCost.totalCostPkr === 170, "250g chicken breast costs PKR 170", `Got ${chickenCost.totalCostPkr}`);
assert(chickenCost.costPer100gPkr === 68, "Cost per 100g = PKR 68", `Got ${chickenCost.costPer100gPkr}`);
// 22.5g protein per 100g costing 68 PKR -> 20g protein = (68 / 22.5) * 20 = PKR 60.4
assert(Math.abs((chickenCost.costPer20gProteinPkr || 0) - 60.4) < 0.5, "Chicken cost per 20g protein = ~PKR 60.4", `Got ${chickenCost.costPer20gProteinPkr}`);

// Eggs in Kotli: PKR 360 per dozen.
// 3 eggs should cost: (3 / 12) * 360 = PKR 90.
const eggPriceKotli = {
  id: "p2",
  city: "Kotli",
  marketRetailer: "Kotli Central Bazaar",
  price: 360,
  quantity: 1,
  unit: "dozen",
  pricePerStandardUnit: 360,
  standardUnit: "dozen",
  currency: "PKR",
  verificationStatus: "verified",
  confidenceLevel: "high",
  collectionDate: new Date(),
};

const eggCost = calculateFoodCost(eggItem, 3, "piece", eggPriceKotli);
assert(eggCost.totalCostPkr === 90, "3 eggs in Kotli cost PKR 90", `Got ${eggCost.totalCostPkr}`);
// 1 egg = 30 PKR, gives ~6.3g protein. 20g protein requires ~3.17 eggs = ~PKR 95.2
assert(Math.abs((eggCost.costPer20gProteinPkr || 0) - 95.2) < 1.0, "Eggs cost per 20g protein = ~PKR 95.2", `Got ${eggCost.costPer20gProteinPkr}`);

// Milk in Lahore: PKR 215 per liter.
// 250 ml (1 glass/cup) should cost: (250 / 1000) * 215 = PKR 53.75 -> 53.8.
const milkItem = {
  id: "test-milk",
  nameEn: "Whole Buffalo / Cow Milk",
  nameUr: "خالص دودھ",
  defaultServingSize: 250,
  defaultServingUnit: "ml",
  servingWeightGrams: 250,
  caloriesPer100g: 65,
  proteinPer100g: 3.4,
  carbsPer100g: 4.8,
  fatPer100g: 3.6,
  fibrePer100g: 0,
};

const milkPriceLahore = {
  id: "p3",
  city: "Lahore",
  marketRetailer: "Gulberg Dairy Outlet",
  price: 215,
  quantity: 1,
  unit: "liter",
  pricePerStandardUnit: 215,
  standardUnit: "liter",
  currency: "PKR",
  verificationStatus: "verified",
  confidenceLevel: "high",
  collectionDate: new Date(),
};

const milkCost = calculateFoodCost(milkItem, 250, "ml", milkPriceLahore);
assert(Math.abs(milkCost.totalCostPkr - 53.8) < 0.2, "250 ml milk in Lahore costs PKR ~53.8", `Got ${milkCost.totalCostPkr}`);

// ---------------------------------------------------------------------------
// 4. Protein Cost-Efficiency Ranking
// ---------------------------------------------------------------------------
console.log("\n[4] Protein Cost-Efficiency Ranking in Pakistani Cities...");

// Daal Chana Raw in Rawalpindi: PKR 260 / kg.
// Protein per 100g: 21.0g. Cost per 100g: PKR 26.
// Cost per 20g protein = (26 / 21) * 20 = PKR 24.8! (Most affordable protein)
const daalRawItem = {
  id: "test-daal-raw",
  nameEn: "Daal Chana (Raw / Dry)",
  nameUr: "دال چنا",
  defaultServingSize: 100,
  defaultServingUnit: "g",
  servingWeightGrams: 100,
  caloriesPer100g: 360,
  proteinPer100g: 21.0,
  carbsPer100g: 58.0,
  fatPer100g: 5.0,
  fibrePer100g: 15.0,
};

const daalPrice = {
  id: "p4",
  city: "Rawalpindi",
  marketRetailer: "Gunj Mandi Grain Market",
  price: 260,
  quantity: 1,
  unit: "kg",
  pricePerStandardUnit: 260,
  standardUnit: "kg",
  currency: "PKR",
  verificationStatus: "verified",
  confidenceLevel: "high",
  collectionDate: new Date(),
};

const rankedProteins = rankProteinCostEfficiency([
  { food: chickenItem, price: chickenPrice },
  { food: eggItem, price: eggPriceKotli },
  { food: daalRawItem, price: daalPrice },
]);

assert(rankedProteins.length === 3, "Ranked 3 protein sources");
assert(rankedProteins[0].food.nameEn === "Daal Chana (Raw / Dry)", "Daal Chana ranked #1 for cost efficiency (~PKR 25 / 20g protein)", `Got ${rankedProteins[0].food.nameEn}`);
assert(rankedProteins[1].food.nameEn === "Chicken Breast (Boneless)", "Chicken Breast ranked #2 (~PKR 60 / 20g protein)", `Got ${rankedProteins[1].food.nameEn}`);
assert(rankedProteins[2].food.nameEn === "Boiled Eggs (Hard Boiled)", "Eggs ranked #3 (~PKR 95 / 20g protein)", `Got ${rankedProteins[2].food.nameEn}`);

console.log("\n=======================================================");
console.log(`ALL ${passed}/${total} NUTRITION & COST CALCULATOR UNIT TESTS PASSED! ✓`);
console.log("=======================================================\n");

