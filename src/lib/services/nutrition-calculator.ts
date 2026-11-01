/**
 * FitLife AI: Core Food Nutrition & Cost Calculation Service (Phase 3)
 *
 * Deterministic, server-side calculations independent of AI:
 * - Unit conversions (g, kg, ml, l, piece, cup, tbsp, tsp, serving)
 * - Food-specific density and household serving weight factors
 * - Macro calculation (Calories, Protein, Carbohydrates, Fat, Fibre)
 * - Localized food cost calculations (Total cost, Cost per 100g, Cost per serving)
 * - Protein cost-efficiency analysis (Cost per 20g Protein in PKR)
 */

export interface FoodNutritionBasics {
  id: string;
  nameEn: string;
  nameUr: string;
  defaultServingSize: number;
  defaultServingUnit: string;
  servingWeightGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
}

export interface FoodPriceBasics {
  id: string;
  city: string;
  marketRetailer: string;
  price: number;
  quantity: number;
  unit: string;
  pricePerStandardUnit: number;
  standardUnit: string;
  currency: string;
  verificationStatus: "verified" | "unverified" | "expired" | "under_review" | string;
  confidenceLevel: string;
  collectionDate: Date | string;
}

export type SupportedServingUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "liter"
  | "piece"
  | "item"
  | "cup"
  | "tbsp"
  | "tsp"
  | "serving"
  | "dozen";

export interface CalculatedNutrition {
  quantity: number;
  unit: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface CalculatedFoodCost {
  quantity: number;
  unit: string;
  weightGrams: number;
  totalCostPkr: number;
  costPer100gPkr: number;
  costPerServingPkr: number;
  costPer20gProteinPkr: number | null;
  currency: string;
  city: string;
  marketRetailer: string;
  verificationStatus: string;
  isEstimate: boolean;
  pricePerStandardUnit: number;
  standardUnit: string;
}

/**
 * Returns the exact gram weight for a given quantity and household unit,
 * using food-specific densities where applicable.
 */
export function convertToGrams(
  food: { nameEn?: string; servingWeightGrams?: number; defaultServingSize?: number },
  quantity: number,
  unit: string
): number {
  const normUnit = unit.toLowerCase().trim();
  const name = (food.nameEn || "").toLowerCase();

  switch (normUnit) {
    case "g":
    case "gram":
    case "grams":
      return quantity;

    case "kg":
    case "kilogram":
    case "kilograms":
      return quantity * 1000;

    case "ml":
    case "milliliter":
    case "milliliters":
      // Milk/liquid density approximation (1.03 for milk, ~1.0 for general)
      if (name.includes("milk") || name.includes("yogurt") || name.includes("dahi")) {
        return Math.round(quantity * 1.03 * 10) / 10;
      }
      return quantity;

    case "l":
    case "liter":
    case "liters":
    case "litre":
    case "litres":
      if (name.includes("milk") || name.includes("yogurt") || name.includes("dahi")) {
        return Math.round(quantity * 1030 * 10) / 10;
      }
      return quantity * 1000;

    case "piece":
    case "pieces":
    case "item":
    case "items":
    case "unit":
      // Food-specific piece weights (if servingWeightGrams provided)
      if (food.servingWeightGrams && food.servingWeightGrams > 0) {
        return Math.round(quantity * food.servingWeightGrams * 10) / 10;
      }
      if (name.includes("egg")) return quantity * 50; // standard medium egg ~50g
      if (name.includes("banana")) return quantity * 118; // medium banana ~118g
      if (name.includes("apple")) return quantity * 182; // medium apple ~182g
      if (name.includes("roti") || name.includes("chapati")) return quantity * 60; // 60g chapati
      if (name.includes("bread")) return quantity * 28; // 28g slice
      return quantity * 100;

    case "dozen":
      if (name.includes("egg")) return quantity * 12 * 50; // 12 eggs * 50g = 600g
      if (name.includes("banana")) return quantity * 12 * 118;
      return quantity * 12 * 100;

    case "cup":
    case "cups":
      // Food-specific cup weights
      if (name.includes("rice") && (name.includes("cooked") || name.includes("boiled"))) return quantity * 158;
      if (name.includes("rice") && (name.includes("raw") || name.includes("uncooked"))) return quantity * 185;
      if (name.includes("oats") || name.includes("dalia")) return quantity * 80;
      if (name.includes("milk")) return quantity * 245;
      if (name.includes("yogurt") || name.includes("dahi")) return quantity * 245;
      if (name.includes("daal") || name.includes("lentil") || name.includes("lentils")) return quantity * 200;
      if (name.includes("chana") || name.includes("chickpea") || name.includes("chickpeas")) return quantity * 164;
      if (name.includes("spinach") || name.includes("palak")) return quantity * 30; // raw chopped
      if (name.includes("flour") || name.includes("atta")) return quantity * 120;
      return quantity * 150; // standard solid cup default

    case "tbsp":
    case "tablespoon":
    case "tablespoons":
      if (name.includes("peanut butter")) return quantity * 16;
      if (name.includes("oil") || name.includes("ghee")) return quantity * 14;
      if (name.includes("seed") || name.includes("seeds")) return quantity * 10;
      return quantity * 15;

    case "tsp":
    case "teaspoon":
    case "teaspoons":
      if (name.includes("oil") || name.includes("ghee")) return quantity * 4.5;
      return quantity * 5;

    case "serving":
    case "servings":
      if (food.servingWeightGrams && food.servingWeightGrams > 0) {
        return Math.round(quantity * food.servingWeightGrams * 10) / 10;
      }
      return quantity * (food.defaultServingSize || 100);

    default:
      return quantity;
  }
}

/**
 * Calculates exact nutritional values for any entered quantity of food.
 */
export function calculateFoodNutrition(
  food: FoodNutritionBasics,
  quantity: number,
  unit: string
): CalculatedNutrition {
  if (quantity < 0) {
    throw new Error("Quantity must be a positive number.");
  }

  const weightGrams = convertToGrams(food, quantity, unit);
  const factor = weightGrams / 100;

  return {
    quantity,
    unit,
    weightGrams: Math.round(weightGrams * 10) / 10,
    calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fibre: Math.round(food.fibrePer100g * factor * 10) / 10,
  };
}

/**
 * Calculates food cost in PKR based on verified local price records.
 */
export function calculateFoodCost(
  food: FoodNutritionBasics,
  quantity: number,
  unit: string,
  priceRecord: FoodPriceBasics
): CalculatedFoodCost {
  const normUnit = unit.toLowerCase().trim();
  const priceUnit = priceRecord.unit.toLowerCase().trim();
  const priceStandardUnit = priceRecord.standardUnit.toLowerCase().trim();
  const name = food.nameEn.toLowerCase();

  let totalCostPkr = 0;

  // Case 1: Unit is dozen (e.g. Eggs)
  if (priceUnit === "dozen" || priceStandardUnit === "dozen") {
    let pieces = quantity;
    if (normUnit === "dozen") {
      pieces = quantity * 12;
    } else if (normUnit === "piece" || normUnit === "item") {
      pieces = quantity;
    } else {
      // Weight in grams converted back to pieces (e.g. 50g per egg)
      const grams = convertToGrams(food, quantity, unit);
      const weightPerPiece = food.servingWeightGrams || 50;
      pieces = grams / weightPerPiece;
    }
    const costPerPiece = priceRecord.price / (priceRecord.quantity * 12);
    totalCostPkr = pieces * costPerPiece;
  }
  // Case 2: Unit is liter (e.g. Milk, Oil)
  else if (priceUnit === "liter" || priceUnit === "l" || priceStandardUnit === "liter") {
    let volumeLiters = quantity;
    if (normUnit === "ml") {
      volumeLiters = quantity / 1000;
    } else if (normUnit === "cup") {
      volumeLiters = (quantity * 250) / 1000;
    } else if (normUnit === "l" || normUnit === "liter") {
      volumeLiters = quantity;
    } else {
      const grams = convertToGrams(food, quantity, unit);
      volumeLiters = grams / 1000;
    }
    const costPerLiter = priceRecord.price / (priceRecord.quantity || 1);
    totalCostPkr = volumeLiters * costPerLiter;
  }
  // Case 3: Weight-based (kg / g)
  else {
    const weightGrams = convertToGrams(food, quantity, unit);
    // pricePerStandardUnit is per kg
    const costPerKg = priceRecord.pricePerStandardUnit || (priceRecord.price / (priceRecord.quantity || 1));
    totalCostPkr = (weightGrams / 1000) * costPerKg;
  }

  const weightGrams = convertToGrams(food, quantity, unit);
  const costPer100gPkr = weightGrams > 0 ? (totalCostPkr / weightGrams) * 100 : 0;
  const servingGrams = food.servingWeightGrams || 100;
  const costPerServingPkr = (costPer100gPkr / 100) * servingGrams;

  // Protein cost efficiency: cost per 20g of protein
  let costPer20gProteinPkr: number | null = null;
  if (food.proteinPer100g > 0) {
    const costPerGramProtein = costPer100gPkr / food.proteinPer100g;
    costPer20gProteinPkr = Math.round(costPerGramProtein * 20 * 10) / 10;
  }

  return {
    quantity,
    unit,
    weightGrams: Math.round(weightGrams * 10) / 10,
    totalCostPkr: Math.round(totalCostPkr * 10) / 10,
    costPer100gPkr: Math.round(costPer100gPkr * 10) / 10,
    costPerServingPkr: Math.round(costPerServingPkr * 10) / 10,
    costPer20gProteinPkr,
    currency: priceRecord.currency || "PKR",
    city: priceRecord.city,
    marketRetailer: priceRecord.marketRetailer,
    verificationStatus: priceRecord.verificationStatus,
    isEstimate: priceRecord.verificationStatus !== "verified",
    pricePerStandardUnit: priceRecord.pricePerStandardUnit,
    standardUnit: priceRecord.standardUnit,
  };
}

/**
 * Compares protein foods in a city to determine the most cost-effective protein sources (PKR / 20g Protein).
 */
export function rankProteinCostEfficiency(
  items: Array<{ food: FoodNutritionBasics; price: FoodPriceBasics }>
): Array<{
  food: FoodNutritionBasics;
  price: FoodPriceBasics;
  costPer20gProteinPkr: number;
  costPer100gPkr: number;
  proteinPer100g: number;
  rank: number;
}> {
  const ranked = items
    .filter((item) => item.food.proteinPer100g >= 3.0 && item.price.price > 0)
    .map((item) => {
      const costResult = calculateFoodCost(item.food, 100, "g", item.price);
      return {
        food: item.food,
        price: item.price,
        costPer20gProteinPkr: costResult.costPer20gProteinPkr || 99999,
        costPer100gPkr: costResult.costPer100gPkr,
        proteinPer100g: item.food.proteinPer100g,
        rank: 0,
      };
    })
    .sort((a, b) => a.costPer20gProteinPkr - b.costPer20gProteinPkr);

  return ranked.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}
