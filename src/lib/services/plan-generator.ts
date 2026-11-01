import { db } from "@/db";
import {
  foodItems,
  foodPrices,
  foodCategories,
  nutritionPlans,
  mealPlans,
  meals,
  mealFoodItems,
  groceryLists,
  groceryListItems,
  userNutritionPreferences,
  type NewNutritionPlan,
  type NewMealPlan,
  type NewMeal,
  type NewMealFoodItem,
  type NewGroceryList,
  type NewGroceryListItem,
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import {
  calculateFoodNutrition,
  calculateFoodCost,
  type FoodNutritionBasics,
  type FoodPriceBasics,
} from "./nutrition-calculator";
import {
  generatePlanWithGroq,
  type FoodCatalogItemForAI,
  type PlanGenerationContext,
  type GroqPlanOutput,
} from "./groq-service";
import {
  GenerateNutritionPlanInput,
  generateNutritionPlanSchema,
} from "../validations/nutrition-plan";

export interface FullMealItem extends Omit<NewMealFoodItem, "mealId"> {
  mealId?: string;
  id?: string;
}

export interface FullMeal extends Omit<NewMeal, "mealPlanId"> {
  id?: string;
  items: FullMealItem[];
}

export interface FullMealPlanDay {
  dayNumber: number;
  dayName: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFibreGrams: number;
  totalCostPkr: number;
  meals: FullMeal[];
}

export interface GeneratedPlanResult {
  plan: typeof nutritionPlans.$inferSelect;
  mealPlans: Array<
    typeof mealPlans.$inferSelect & {
      meals: Array<typeof meals.$inferSelect & { items: typeof mealFoodItems.$inferSelect[] }>;
    }
  >;
  groceryList: typeof groceryLists.$inferSelect & {
    items: typeof groceryListItems.$inferSelect[];
  };
}

/**
 * Loads all food catalog items alongside verified local prices for the target city (or fallback).
 */
export async function getFoodCatalogWithPrices(
  city: string = "Rawalpindi"
): Promise<{
  catalogForAI: FoodCatalogItemForAI[];
  foodMap: Map<string, typeof foodItems.$inferSelect>;
  priceMap: Map<string, FoodPriceBasics>;
  categoryMap: Map<string, string>; // categoryId -> slug
}> {
  const allFoods = await db.select().from(foodItems);
  const allCategories = await db.select().from(foodCategories);
  const catSlugMap = new Map<string, string>();
  for (const c of allCategories) {
    catSlugMap.set(c.id, c.slug);
  }

  // Retrieve prices
  const allPrices = await db
    .select()
    .from(foodPrices)
    .where(eq(foodPrices.verificationStatus, "verified"))
    .orderBy(desc(foodPrices.collectionDate));

  const foodMap = new Map<string, typeof foodItems.$inferSelect>();
  const priceMap = new Map<string, FoodPriceBasics>();

  for (const food of allFoods) {
    foodMap.set(food.id, food);

    // Look for price in specified city first
    const cityPrice = allPrices.find(
      (p) => p.foodId === food.id && p.city.toLowerCase() === city.toLowerCase()
    );
    // Otherwise fallback to any verified price for this food
    const fallbackPrice = allPrices.find((p) => p.foodId === food.id);
    const chosenPrice = cityPrice || fallbackPrice;

    if (chosenPrice) {
      priceMap.set(food.id, {
        id: chosenPrice.id,
        city: chosenPrice.city,
        marketRetailer: chosenPrice.marketRetailer,
        price: chosenPrice.price,
        quantity: chosenPrice.quantity,
        unit: chosenPrice.unit,
        pricePerStandardUnit: chosenPrice.pricePerStandardUnit,
        standardUnit: chosenPrice.standardUnit,
        currency: chosenPrice.currency,
        verificationStatus: chosenPrice.verificationStatus,
        confidenceLevel: chosenPrice.confidenceLevel,
        collectionDate: chosenPrice.collectionDate,
      });
    }
  }

  const catalogForAI: FoodCatalogItemForAI[] = allFoods.map((f) => {
    const pr = priceMap.get(f.id);
    const catSlug = catSlugMap.get(f.categoryId) || "other";

    let costPer20gProtein: number | null = null;
    if (pr && f.proteinPer100g > 0) {
      const basicFood: FoodNutritionBasics = {
        id: f.id,
        nameEn: f.nameEn,
        nameUr: f.nameUr,
        defaultServingSize: f.defaultServingSize,
        defaultServingUnit: f.defaultServingUnit,
        servingWeightGrams: f.servingWeightGrams,
        caloriesPer100g: f.caloriesPer100g,
        proteinPer100g: f.proteinPer100g,
        carbsPer100g: f.carbsPer100g,
        fatPer100g: f.fatPer100g,
        fibrePer100g: f.fibrePer100g,
      };
      try {
        const costRes = calculateFoodCost(basicFood, 100, "g", pr);
        costPer20gProtein = costRes.costPer20gProteinPkr;
      } catch {
        // ignore
      }
    }

    return {
      id: f.id,
      nameEn: f.nameEn,
      nameUr: f.nameUr,
      category: catSlug,
      defaultServingSize: f.defaultServingSize,
      defaultServingUnit: f.defaultServingUnit,
      caloriesPer100g: f.caloriesPer100g,
      proteinPer100g: f.proteinPer100g,
      carbsPer100g: f.carbsPer100g,
      fatPer100g: f.fatPer100g,
      fibrePer100g: f.fibrePer100g,
      pricePkr: pr ? pr.price : undefined,
      priceUnit: pr ? pr.unit : undefined,
      costPer20gProtein,
    };
  });

  return { catalogForAI, foodMap, priceMap, categoryMap: catSlugMap };
}

/**
 * Deterministic Pakistani meal generator when AI is disabled or offline.
 */
export function generateDeterministicPakistaniPlan(
  context: PlanGenerationContext,
  allFoods: typeof foodItems.$inferSelect[],
  priceMap: Map<string, FoodPriceBasics>,
  categoryMap: Map<string, string>
): FullMeal[] {
  // Find key food items safely
  const findFood = (keywords: string[]) => {
    return allFoods.find((f) => {
      const name = f.nameEn.toLowerCase();
      const match = keywords.some((k) => name.includes(k.toLowerCase()));
      const isExcluded = context.excludedFoods.some((ex) => name.includes(ex.toLowerCase()));
      const isAllergic = context.allergies.some((al) => name.includes(al.toLowerCase()));
      return match && !isExcluded && !isAllergic;
    });
  };

  const eggs = findFood(["farm egg", "egg"]) || allFoods[0];
  const milk = findFood(["milk", "buffalo milk", "cow milk"]) || allFoods[1];
  const chicken = findFood(["chicken breast", "chicken"]) || allFoods[0];
  const daalChana = findFood(["chana", "daal chana", "lentil"]) || allFoods[0];
  const daalMasoor = findFood(["masoor", "daal", "lentil"]) || daalChana;
  const atta = findFood(["wheat flour", "atta", "roti", "bread"]) || allFoods[2];
  const rice = findFood(["rice", "basmati"]) || allFoods[2];
  const banana = findFood(["banana", "kela"]) || allFoods[3];
  const apple = findFood(["apple", "saib"]) || banana;
  const yogurt = findFood(["yogurt", "dahi"]) || milk;
  const spinach = findFood(["spinach", "palak"]) || allFoods[4];
  const salad = findFood(["cucumber", "kheera", "tomato"]) || allFoods[4];
  const oil = findFood(["cooking oil", "mustard oil", "oil", "ghee"]) || allFoods[5];
  const almonds = findFood(["almond", "peanut", "walnut"]) || allFoods[5];

  const mealsCount = Math.min(6, Math.max(3, context.mealsPerDay));
  const isBudgetTight = context.dailyBudget < 450;
  const isHighProtein = context.goal === "muscle_building" || context.dietaryType === "high_protein";
  const isVeg = context.dietaryType === "vegetarian";

  // Calorie allocations based on meal count
  let calFractions: number[] = [];
  if (mealsCount === 3) calFractions = [0.3, 0.4, 0.3];
  else if (mealsCount === 4) calFractions = [0.25, 0.35, 0.15, 0.25];
  else if (mealsCount === 5) calFractions = [0.25, 0.1, 0.3, 0.15, 0.2];
  else calFractions = [0.2, 0.1, 0.25, 0.15, 0.2, 0.1];

  const planMeals: FullMeal[] = [];

  // Slot 1: Breakfast
  const bCal = context.targetCalories * calFractions[0];
  const eggCount = isHighProtein ? 3 : 2;
  planMeals.push({
    mealType: "breakfast",
    nameEn: "Desi Omelette with Whole Wheat Roti & Tea/Milk",
    nameUr: "دیسی آملیٹ، چکی آٹے کی روٹی اور دودھ",
    prepTimeMinutes: 15,
    instructions:
      "Whisk farm eggs with chopped onions, green chilies, and pinch of pink salt. Lightly cook on a tawa with 1 tsp oil. Serve hot with fresh whole wheat roti and warm milk. (انڈے میں پیاز اور ہری مرچ ملا کر ہلکے تیل میں تلیں اور تازہ گرم روٹی اور دودھ کے ساتھ کھائیں)",
    targetCalories: bCal,
    totalCalories: 0,
    totalProteinGrams: 0,
    totalCarbsGrams: 0,
    totalFatGrams: 0,
    totalFibreGrams: 0,
    totalCostPkr: 0,
    displayOrder: 1,
    items: [
      {
        nameEn: eggs.nameEn,
        nameUr: eggs.nameUr,
        foodItemId: eggs.id,
        quantity: eggCount,
        unit: "piece",
        weightGrams: eggCount * 50,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: atta.nameEn,
        nameUr: atta.nameUr,
        foodItemId: atta.id,
        quantity: 1,
        unit: "piece", // 1 standard 60g roti
        weightGrams: 60,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: milk.nameEn,
        nameUr: milk.nameUr,
        foodItemId: milk.id,
        quantity: 1,
        unit: "cup",
        weightGrams: 245,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
    ],
  });

  // Slot 2: Morning Snack (if 5 or 6 meals)
  if (mealsCount >= 5) {
    const s1Cal = context.targetCalories * calFractions[1];
    planMeals.push({
      mealType: "morning_snack",
      nameEn: "Fresh Seasonal Fruit & Roasted Peanuts",
      nameUr: "تازہ پھل اور بھنی ہوئی مونگ پھلی",
      prepTimeMinutes: 5,
      instructions: "Enjoy a fresh ripe banana or apple paired with crunchy roasted nuts for sustained energy. (تازہ پھل اور مغزیات)",
      targetCalories: s1Cal,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFibreGrams: 0,
      totalCostPkr: 0,
      displayOrder: 2,
      items: [
        {
          nameEn: banana.nameEn,
          nameUr: banana.nameUr,
          foodItemId: banana.id,
          quantity: 1,
          unit: "piece",
          weightGrams: 118,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
        },
        {
          nameEn: almonds.nameEn,
          nameUr: almonds.nameUr,
          foodItemId: almonds.id,
          quantity: 20,
          unit: "g",
          weightGrams: 20,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
        },
      ],
    });
  }

  // Lunch Slot
  const lunchIdx = mealsCount >= 5 ? 2 : 1;
  const lCal = context.targetCalories * calFractions[lunchIdx];
  const lunchProtein = isVeg || (isBudgetTight && context.dailyBudget < 350) ? daalChana : chicken;
  const lunchProteinQty = lunchProtein.id === chicken.id ? 150 : 180;

  planMeals.push({
    mealType: "lunch",
    nameEn:
      lunchProtein.id === chicken.id
        ? "Grilled Chicken / Karahi with Basmati Rice & Kachumber Salad"
        : "Tarka Daal Chana with Fragrant Basmati Rice & Fresh Salad",
    nameUr:
      lunchProtein.id === chicken.id
        ? "مرغی کا سالن / گرل چکن، باسمتی چاول اور کچومر سلاد"
        : "دال چنا تڑکا، باسمتی چاول اور تازہ سلاد",
    prepTimeMinutes: 30,
    instructions:
      lunchProtein.id === chicken.id
        ? "Cook chicken breast cubes with ginger, garlic, tomatoes, and traditional Pakistani spices in 1 tsp olive or mustard oil. Serve over steamed basmati rice with cucumber tomato salad. (چکن بریسٹ کو ادرک لہسن اور ٹماٹر کے ساتھ ہلکی آنچ پر پکائیں اور چاول اور سلاد کے ساتھ کھائیں)"
        : "Boil soaked Daal Chana until tender. Temper with zeera, garlic, and 1 tsp mustard oil. Serve over boiled rice with fresh crunchy cucumber and onion salad. (دال چنا کو ابال کر زیرہ اور لہسن کا تڑکا لگائیں اور چاول اور کچومر سلاد کے ساتھ پیش کریں)",
    targetCalories: lCal,
    totalCalories: 0,
    totalProteinGrams: 0,
    totalCarbsGrams: 0,
    totalFatGrams: 0,
    totalFibreGrams: 0,
    totalCostPkr: 0,
    displayOrder: lunchIdx + 1,
    items: [
      {
        nameEn: lunchProtein.nameEn,
        nameUr: lunchProtein.nameUr,
        foodItemId: lunchProtein.id,
        quantity: lunchProteinQty,
        unit: "g",
        weightGrams: lunchProteinQty,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: rice.nameEn,
        nameUr: rice.nameUr,
        foodItemId: rice.id,
        quantity: 1,
        unit: "cup",
        weightGrams: 158,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: salad.nameEn,
        nameUr: salad.nameUr,
        foodItemId: salad.id,
        quantity: 100,
        unit: "g",
        weightGrams: 100,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
    ],
  });

  // Afternoon / Evening Snack (if 4, 5, or 6 meals)
  if (mealsCount >= 4) {
    const snkIdx = mealsCount >= 5 ? 3 : 2;
    const snkCal = context.targetCalories * calFractions[snkIdx];
    planMeals.push({
      mealType: "evening_snack",
      nameEn: "High-Protein Fresh Dahi (Yogurt) with Apple Slices",
      nameUr: "تازہ دہی اور سیب کے قتلے",
      prepTimeMinutes: 5,
      instructions: "Whisk rich low-fat yogurt until smooth. Add sliced fresh apples and a dash of cinnamon. (تازہ دہی کو پھینٹ کر اس میں سیب شامل کریں)",
      targetCalories: snkCal,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFibreGrams: 0,
      totalCostPkr: 0,
      displayOrder: snkIdx + 1,
      items: [
        {
          nameEn: yogurt.nameEn,
          nameUr: yogurt.nameUr,
          foodItemId: yogurt.id,
          quantity: 1,
          unit: "cup",
          weightGrams: 245,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
        },
        {
          nameEn: apple.nameEn,
          nameUr: apple.nameUr,
          foodItemId: apple.id,
          quantity: 1,
          unit: "piece",
          weightGrams: 182,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
        },
      ],
    });
  }

  // Dinner Slot
  const dinIdx = planMeals.length;
  const dCal = context.targetCalories * calFractions[dinIdx];
  const dinnerProtein = isVeg ? daalMasoor : (isBudgetTight ? eggs : chicken);
  const dinnerQty = dinnerProtein.id === eggs.id ? 2 : 150;
  const dinnerUnit = dinnerProtein.id === eggs.id ? "piece" : "g";
  const dinnerGrams = dinnerProtein.id === eggs.id ? 100 : 150;

  planMeals.push({
    mealType: "dinner",
    nameEn: "Wholesome Desi Dinner: Protein Bhurji/Salun with Palak & Roti",
    nameUr: "غذائیت سے بھرپور دیسی رات کا کھانا: پالک سالن اور چکی روٹی",
    prepTimeMinutes: 25,
    instructions:
      "Saute finely chopped spinach with tomatoes, cumin, and Pakistani spices. Combine with your protein source (egg bhurji, chicken curry, or lentils). Enjoy with 1 warm whole wheat chapati. (پالک اور ٹماٹر کو دیسی مصالحوں کے ساتھ پکا کر روٹی کے ساتھ نوش فرمائیں)",
    targetCalories: dCal,
    totalCalories: 0,
    totalProteinGrams: 0,
    totalCarbsGrams: 0,
    totalFatGrams: 0,
    totalFibreGrams: 0,
    totalCostPkr: 0,
    displayOrder: dinIdx + 1,
    items: [
      {
        nameEn: dinnerProtein.nameEn,
        nameUr: dinnerProtein.nameUr,
        foodItemId: dinnerProtein.id,
        quantity: dinnerQty,
        unit: dinnerUnit,
        weightGrams: dinnerGrams,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: spinach.nameEn,
        nameUr: spinach.nameUr,
        foodItemId: spinach.id,
        quantity: 1,
        unit: "cup",
        weightGrams: 150,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
      {
        nameEn: atta.nameEn,
        nameUr: atta.nameUr,
        foodItemId: atta.id,
        quantity: 1,
        unit: "piece",
        weightGrams: 60,
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fibreGrams: 0,
        costPkr: 0,
      },
    ],
  });

  // Bedtime Snack (if 6 meals)
  if (mealsCount === 6) {
    const bsnkCal = context.targetCalories * calFractions[5];
    planMeals.push({
      mealType: "dinner", // or bedtime
      nameEn: "Bedtime Warm Milk & Roasted Almonds",
      nameUr: "نیم گرم دودھ اور بادام",
      prepTimeMinutes: 5,
      instructions: "Drink warm low-fat milk infused with cardamom for optimal overnight muscle recovery and sleep quality. (رات کو سونے سے پہلے گرم دودھ اور بادام)",
      targetCalories: bsnkCal,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFibreGrams: 0,
      totalCostPkr: 0,
      displayOrder: 6,
      items: [
        {
          nameEn: milk.nameEn,
          nameUr: milk.nameUr,
          foodItemId: milk.id,
          quantity: 1,
          unit: "cup",
          weightGrams: 245,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
        },
      ],
    });
  }

  return planMeals;
}

/**
 * Core function that generates, computes, grounds, and persists a complete FitLife AI Nutrition Plan.
 */
export async function generateAndSaveNutritionPlan(
  userId: string,
  rawInput: GenerateNutritionPlanInput
): Promise<GeneratedPlanResult> {
  const input = generateNutritionPlanSchema.parse(rawInput);

  // 1. Load catalog with localized prices
  const { catalogForAI, foodMap, priceMap, categoryMap } = await getFoodCatalogWithPrices(
    input.city
  );

  const context: PlanGenerationContext = {
    goal: input.goal,
    targetCalories: input.targetCalories,
    targetProteinGrams: input.targetProteinGrams,
    targetCarbsGrams: input.targetCarbsGrams,
    targetFatGrams: input.targetFatGrams,
    targetFibreGrams: input.targetFibreGrams ?? 25,
    dailyBudget: input.dailyBudget,
    currency: input.currency || "PKR",
    city: input.city,
    mealsPerDay: input.mealsPerDay,
    cookingTimeMinutes: input.cookingTimeMinutes,
    dietaryType: input.dietaryType,
    allergies: input.allergies || [],
    excludedFoods: input.excludedFoods || [],
    dietaryRestrictions: input.dietaryRestrictions || ["halal"],
    preferredFoods: input.preferredFoods || [],
  };

  // 2. Try AI first if requested
  let aiOutput: GroqPlanOutput | null = null;
  let modelUsed = "deterministic_engine";

  if (input.useAi) {
    aiOutput = await generatePlanWithGroq(context, catalogForAI);
    if (aiOutput) {
      modelUsed = "groq_llama_3.3_70b";
    }
  }

  // 3. Build meals structure
  let draftMeals: FullMeal[] = [];
  let aiNotes = "";

  if (aiOutput && aiOutput.meals.length >= 3) {
    aiNotes = aiOutput.aiNotes;
    draftMeals = aiOutput.meals.map((m, idx) => ({
      mealType: m.mealType,
      nameEn: m.nameEn,
      nameUr: m.nameUr,
      prepTimeMinutes: m.prepTimeMinutes,
      instructions: m.instructions,
      targetCalories: Math.round(input.targetCalories / aiOutput!.meals.length),
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFibreGrams: 0,
      totalCostPkr: 0,
      displayOrder: idx + 1,
      items: m.items.map((it) => {
        const food = foodMap.get(it.foodItemId)!;
        return {
          foodItemId: it.foodItemId,
          nameEn: food.nameEn,
          nameUr: food.nameUr,
          quantity: it.quantity,
          unit: it.unit,
          weightGrams: 0,
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
          fibreGrams: 0,
          costPkr: 0,
          notes: it.notes,
        };
      }),
    }));
  } else {
    // Deterministic fallback
    draftMeals = generateDeterministicPakistaniPlan(
      context,
      Array.from(foodMap.values()),
      priceMap,
      categoryMap
    );
    aiNotes = `Culturally optimized Pakistani nutrition plan tailored for ${input.city}. Designed to meet your ${input.goal.replace(/_/g, " ")} target of ${Math.round(input.targetCalories)} kcal within an estimated daily budget of ${input.currency} ${input.dailyBudget}.`;
  }

  // 4. Ground EVERY item deterministically using verified DB formulas
  let planTotalCalories = 0;
  let planTotalProtein = 0;
  let planTotalCarbs = 0;
  let planTotalFat = 0;
  let planTotalFibre = 0;
  let planDailyCost = 0;

  for (const meal of draftMeals) {
    let mealCal = 0;
    let mealPro = 0;
    let mealCarb = 0;
    let mealFat = 0;
    let mealFib = 0;
    let mealCost = 0;

    for (const item of meal.items) {
      const food = foodMap.get(item.foodItemId!);
      if (!food) continue;

      const basicFood: FoodNutritionBasics = {
        id: food.id,
        nameEn: food.nameEn,
        nameUr: food.nameUr,
        defaultServingSize: food.defaultServingSize,
        defaultServingUnit: food.defaultServingUnit,
        servingWeightGrams: food.servingWeightGrams,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        fibrePer100g: food.fibrePer100g,
      };

      // Compute exact nutrition
      const nutrition = calculateFoodNutrition(basicFood, item.quantity, item.unit);
      item.weightGrams = nutrition.weightGrams;
      item.calories = nutrition.calories;
      item.proteinGrams = nutrition.protein;
      item.carbsGrams = nutrition.carbs;
      item.fatGrams = nutrition.fat;
      item.fibreGrams = nutrition.fibre;

      // Compute exact cost from local prices
      const pr = priceMap.get(food.id);
      if (pr) {
        const costRes = calculateFoodCost(basicFood, item.quantity, item.unit, pr);
        item.costPkr = costRes.totalCostPkr;
        item.priceSource = `${pr.marketRetailer} (${pr.city})`;
        item.isVerifiedPrice = pr.verificationStatus === "verified";
      } else {
        item.costPkr = 0;
        item.priceSource = "Estimated";
        item.isVerifiedPrice = false;
      }

      mealCal += item.calories;
      mealPro += item.proteinGrams;
      mealCarb += item.carbsGrams;
      mealFat += item.fatGrams;
      mealFib += item.fibreGrams;
      mealCost += item.costPkr;
    }

    meal.totalCalories = Math.round(mealCal * 10) / 10;
    meal.totalProteinGrams = Math.round(mealPro * 10) / 10;
    meal.totalCarbsGrams = Math.round(mealCarb * 10) / 10;
    meal.totalFatGrams = Math.round(mealFat * 10) / 10;
    meal.totalFibreGrams = Math.round(mealFib * 10) / 10;
    meal.totalCostPkr = Math.round(mealCost * 10) / 10;

    planTotalCalories += meal.totalCalories;
    planTotalProtein += meal.totalProteinGrams;
    planTotalCarbs += meal.totalCarbsGrams;
    planTotalFat += meal.totalFatGrams;
    planTotalFibre += meal.totalFibreGrams;
    planDailyCost += meal.totalCostPkr;
  }

  planTotalCalories = Math.round(planTotalCalories * 10) / 10;
  planTotalProtein = Math.round(planTotalProtein * 10) / 10;
  planTotalCarbs = Math.round(planTotalCarbs * 10) / 10;
  planTotalFat = Math.round(planTotalFat * 10) / 10;
  planTotalFibre = Math.round(planTotalFibre * 10) / 10;
  planDailyCost = Math.round(planDailyCost * 10) / 10;

  const isBudgetExceeded = planDailyCost > input.dailyBudget;
  if (isBudgetExceeded) {
    const diff = Math.round(planDailyCost - input.dailyBudget);
    aiNotes += `\n⚠️ Budget Notice: Daily estimated cost (PKR ${planDailyCost}) exceeds your target budget by PKR ${diff}. You can use the "Substitute Food" button on meat/nuts to swap them for high-protein Pakistani staples like Daal Chana or Farm Eggs to bring the daily cost within budget.`;
  }

  // 5. Persist to PostgreSQL database
  const planName =
    input.name ||
    `${input.goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Plan (${input.city})`;

  // Save / Upsert user preferences
  await db
    .insert(userNutritionPreferences)
    .values({
      userId,
      dailyBudget: input.dailyBudget,
      budgetPeriod: input.budgetPeriod || "daily",
      currency: input.currency || "PKR",
      city: input.city,
      mealsPerDay: input.mealsPerDay,
      cookingTimeMinutes: input.cookingTimeMinutes,
      dietaryType: input.dietaryType,
      preferredFoods: input.preferredFoods || [],
      excludedFoods: input.excludedFoods || [],
      allergies: input.allergies || [],
      dietaryRestrictions: input.dietaryRestrictions || ["halal"],
    })
    .onConflictDoUpdate({
      target: userNutritionPreferences.userId,
      set: {
        dailyBudget: input.dailyBudget,
        budgetPeriod: input.budgetPeriod || "daily",
        city: input.city,
        mealsPerDay: input.mealsPerDay,
        cookingTimeMinutes: input.cookingTimeMinutes,
        dietaryType: input.dietaryType,
        preferredFoods: input.preferredFoods || [],
        excludedFoods: input.excludedFoods || [],
        allergies: input.allergies || [],
        dietaryRestrictions: input.dietaryRestrictions || ["halal"],
        updatedAt: new Date(),
      },
    });

  // Archive any older active plan for this user
  await db
    .update(nutritionPlans)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(nutritionPlans.userId, userId), eq(nutritionPlans.status, "active")));

  // Insert Nutrition Plan
  const [newPlan] = await db
    .insert(nutritionPlans)
    .values({
      userId,
      name: planName,
      goal: input.goal,
      targetCalories: input.targetCalories,
      targetProteinGrams: input.targetProteinGrams,
      targetCarbsGrams: input.targetCarbsGrams,
      targetFatGrams: input.targetFatGrams,
      targetFibreGrams: input.targetFibreGrams ?? 25,
      dailyBudget: input.dailyBudget,
      budgetPeriod: input.budgetPeriod || "daily",
      currency: input.currency || "PKR",
      city: input.city,
      mealsPerDay: input.mealsPerDay,
      status: "active",
      totalCalories: planTotalCalories,
      totalProteinGrams: planTotalProtein,
      totalCarbsGrams: planTotalCarbs,
      totalFatGrams: planTotalFat,
      totalFibreGrams: planTotalFibre,
      totalDailyCostPkr: planDailyCost,
      isBudgetExceeded,
      aiNotes,
      aiModel: modelUsed,
    })
    .returning();

  // Insert Meal Plan (Day 1 Daily Routine)
  const [newDayPlan] = await db
    .insert(mealPlans)
    .values({
      nutritionPlanId: newPlan.id,
      dayNumber: 1,
      dayName: "Daily Pakistani Routine",
      totalCalories: planTotalCalories,
      totalProteinGrams: planTotalProtein,
      totalCarbsGrams: planTotalCarbs,
      totalFatGrams: planTotalFat,
      totalFibreGrams: planTotalFibre,
      totalCostPkr: planDailyCost,
      notes: "Daily balanced nutrition schedule grounded in local market availability.",
    })
    .returning();

  // Insert Meals and Food Items
  const savedMealsWithItems: Array<
    typeof meals.$inferSelect & { items: typeof mealFoodItems.$inferSelect[] }
  > = [];

  for (const meal of draftMeals) {
    const [savedMeal] = await db
      .insert(meals)
      .values({
        mealPlanId: newDayPlan.id,
        mealType: meal.mealType,
        nameEn: meal.nameEn,
        nameUr: meal.nameUr,
        prepTimeMinutes: meal.prepTimeMinutes,
        instructions: meal.instructions,
        targetCalories: meal.targetCalories,
        totalCalories: meal.totalCalories,
        totalProteinGrams: meal.totalProteinGrams,
        totalCarbsGrams: meal.totalCarbsGrams,
        totalFatGrams: meal.totalFatGrams,
        totalFibreGrams: meal.totalFibreGrams,
        totalCostPkr: meal.totalCostPkr,
        displayOrder: meal.displayOrder,
      })
      .returning();

    const itemsToInsert: NewMealFoodItem[] = meal.items.map((it) => ({
      mealId: savedMeal.id,
      foodItemId: it.foodItemId,
      nameEn: it.nameEn,
      nameUr: it.nameUr,
      quantity: it.quantity,
      unit: it.unit,
      weightGrams: it.weightGrams,
      calories: it.calories,
      proteinGrams: it.proteinGrams,
      carbsGrams: it.carbsGrams,
      fatGrams: it.fatGrams,
      fibreGrams: it.fibreGrams,
      costPkr: it.costPkr,
      priceSource: it.priceSource,
      isVerifiedPrice: it.isVerifiedPrice,
      notes: it.notes,
    }));

    const savedItems = await db.insert(mealFoodItems).values(itemsToInsert).returning();
    savedMealsWithItems.push({ ...savedMeal, items: savedItems });
  }

  // 6. Generate Deduplicated 7-Day Grocery List
  const planDays = input.planDays || 7;
  const groceryAggregation = new Map<
    string,
    {
      foodItemId: string | null;
      nameEn: string;
      nameUr: string;
      category: string;
      totalQuantity: number;
      unit: string;
      estimatedCostPkr: number;
      priceSource: string | null;
      isVerified: boolean;
    }
  >();

  for (const m of savedMealsWithItems) {
    for (const it of m.items) {
      const key = `${it.foodItemId || it.nameEn}_${it.unit}`;
      const food = it.foodItemId ? foodMap.get(it.foodItemId) : null;
      const catSlug = (food && categoryMap.get(food.categoryId)) || "other";

      const existing = groceryAggregation.get(key);
      const weeklyQty = Math.round(it.quantity * planDays * 10) / 10;
      const weeklyCost = Math.round(it.costPkr * planDays * 10) / 10;

      if (existing) {
        existing.totalQuantity = Math.round((existing.totalQuantity + weeklyQty) * 10) / 10;
        existing.estimatedCostPkr = Math.round((existing.estimatedCostPkr + weeklyCost) * 10) / 10;
      } else {
        groceryAggregation.set(key, {
          foodItemId: it.foodItemId,
          nameEn: it.nameEn,
          nameUr: it.nameUr,
          category: catSlug,
          totalQuantity: weeklyQty,
          unit: it.unit,
          estimatedCostPkr: weeklyCost,
          priceSource: it.priceSource,
          isVerified: it.isVerifiedPrice,
        });
      }
    }
  }

  const totalWeeklyGroceryCost = Math.round(
    Array.from(groceryAggregation.values()).reduce((sum, g) => sum + g.estimatedCostPkr, 0) * 10
  ) / 10;

  const [savedGroceryList] = await db
    .insert(groceryLists)
    .values({
      nutritionPlanId: newPlan.id,
      userId,
      name: `7-Day Grocery List - ${planName}`,
      daysCovered: planDays,
      totalEstimatedCostPkr: totalWeeklyGroceryCost,
      status: "active",
    })
    .returning();

  const groceryListItemsToInsert: NewGroceryListItem[] = Array.from(
    groceryAggregation.values()
  ).map((g) => ({
    groceryListId: savedGroceryList.id,
    foodItemId: g.foodItemId,
    itemNameEn: g.nameEn,
    itemNameUr: g.nameUr,
    category: g.category,
    totalQuantity: g.totalQuantity,
    unit: g.unit,
    estimatedCostPkr: g.estimatedCostPkr,
    isPurchased: false,
    priceSource: g.priceSource,
    isVerifiedPrice: g.isVerified,
  }));

  const savedGroceryItems = await db
    .insert(groceryListItems)
    .values(groceryListItemsToInsert)
    .returning();

  return {
    plan: newPlan,
    mealPlans: [{ ...newDayPlan, meals: savedMealsWithItems }],
    groceryList: { ...savedGroceryList, items: savedGroceryItems },
  };
}

/**
 * Retrieves a full nutrition plan by ID, verifying user ownership.
 */
export async function getFullNutritionPlan(planId: string, userId: string) {
  const [plan] = await db
    .select()
    .from(nutritionPlans)
    .where(and(eq(nutritionPlans.id, planId), eq(nutritionPlans.userId, userId)))
    .limit(1);

  if (!plan) return null;

  const dayPlans = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.nutritionPlanId, plan.id))
    .orderBy(mealPlans.dayNumber);

  const fullDays = [];
  for (const day of dayPlans) {
    const dayMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.mealPlanId, day.id))
      .orderBy(meals.displayOrder);

    const mealsWithItems = [];
    for (const m of dayMeals) {
      const items = await db.select().from(mealFoodItems).where(eq(mealFoodItems.mealId, m.id));
      mealsWithItems.push({ ...m, items });
    }
    fullDays.push({ ...day, meals: mealsWithItems });
  }

  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.nutritionPlanId, plan.id))
    .limit(1);

  let gItems: typeof groceryListItems.$inferSelect[] = [];
  if (groceryList) {
    gItems = await db
      .select()
      .from(groceryListItems)
      .where(eq(groceryListItems.groceryListId, groceryList.id));
  }

  return {
    plan,
    mealPlans: fullDays,
    groceryList: groceryList ? { ...groceryList, items: gItems } : null,
  };
}
