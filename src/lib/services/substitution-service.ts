import { db } from "@/db";
import {
  foodItems,
  foodPrices,
  foodCategories,
  nutritionPlans,
  mealPlans,
  meals,
  mealFoodItems,
  foodSubstitutions,
  groceryLists,
  groceryListItems,
  type NewMealFoodItem,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  calculateFoodNutrition,
  calculateFoodCost,
  type FoodNutritionBasics,
  type FoodPriceBasics,
} from "./nutrition-calculator";
import { regenerateMealWithGroq } from "./groq-service";
import { getFoodCatalogWithPrices } from "./plan-generator";

export interface SubstituteResult {
  updatedMeal: typeof meals.$inferSelect & { items: typeof mealFoodItems.$inferSelect[] };
  updatedPlan: typeof nutritionPlans.$inferSelect;
  substitutionRecord: typeof foodSubstitutions.$inferSelect;
}

export interface RegenerateMealResult {
  updatedMeal: typeof meals.$inferSelect & { items: typeof mealFoodItems.$inferSelect[] };
  updatedPlan: typeof nutritionPlans.$inferSelect;
}

/**
 * Re-aggregates and updates the 7-day grocery list whenever meals or items change.
 */
export async function syncGroceryList(nutritionPlanId: string) {
  const [gList] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.nutritionPlanId, nutritionPlanId))
    .limit(1);

  if (!gList) return;

  const daysCovered = gList.daysCovered || 7;

  // Retrieve all meals across this plan
  const planDays = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.nutritionPlanId, nutritionPlanId));

  const allItems: typeof mealFoodItems.$inferSelect[] = [];
  for (const day of planDays) {
    const dayMeals = await db.select().from(meals).where(eq(meals.mealPlanId, day.id));
    for (const m of dayMeals) {
      const items = await db.select().from(mealFoodItems).where(eq(mealFoodItems.mealId, m.id));
      allItems.push(...items);
    }
  }

  // Load category map
  const allFoods = await db.select().from(foodItems);
  const allCats = await db.select().from(foodCategories);
  const catSlugMap = new Map<string, string>();
  for (const c of allCats) catSlugMap.set(c.id, c.slug);
  const foodCatMap = new Map<string, string>();
  for (const f of allFoods) foodCatMap.set(f.id, catSlugMap.get(f.categoryId) || "other");

  const agg = new Map<
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

  for (const it of allItems) {
    const key = `${it.foodItemId || it.nameEn}_${it.unit}`;
    const category = (it.foodItemId && foodCatMap.get(it.foodItemId)) || "other";
    const weeklyQty = Math.round(it.quantity * daysCovered * 10) / 10;
    const weeklyCost = Math.round(it.costPkr * daysCovered * 10) / 10;

    const existing = agg.get(key);
    if (existing) {
      existing.totalQuantity = Math.round((existing.totalQuantity + weeklyQty) * 10) / 10;
      existing.estimatedCostPkr = Math.round((existing.estimatedCostPkr + weeklyCost) * 10) / 10;
    } else {
      agg.set(key, {
        foodItemId: it.foodItemId,
        nameEn: it.nameEn,
        nameUr: it.nameUr,
        category,
        totalQuantity: weeklyQty,
        unit: it.unit,
        estimatedCostPkr: weeklyCost,
        priceSource: it.priceSource,
        isVerified: it.isVerifiedPrice,
      });
    }
  }

  // Delete previous items and insert new aggregated items
  await db.delete(groceryListItems).where(eq(groceryListItems.groceryListId, gList.id));

  const itemsToInsert = Array.from(agg.values()).map((g) => ({
    groceryListId: gList.id,
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

  if (itemsToInsert.length > 0) {
    await db.insert(groceryListItems).values(itemsToInsert);
  }

  const totalCost = Math.round(
    itemsToInsert.reduce((sum, i) => sum + i.estimatedCostPkr, 0) * 10
  ) / 10;

  await db
    .update(groceryLists)
    .set({ totalEstimatedCostPkr: totalCost, updatedAt: new Date() })
    .where(eq(groceryLists.id, gList.id));
}

/**
 * Re-sums a meal, its day plan, and the parent nutrition plan.
 */
export async function recalculateMealAndPlanTotals(mealId: string) {
  // Re-sum meal
  const items = await db.select().from(mealFoodItems).where(eq(mealFoodItems.mealId, mealId));

  let mealCal = 0;
  let mealPro = 0;
  let mealCarb = 0;
  let mealFat = 0;
  let mealFib = 0;
  let mealCost = 0;

  for (const it of items) {
    mealCal += it.calories;
    mealPro += it.proteinGrams;
    mealCarb += it.carbsGrams;
    mealFat += it.fatGrams;
    mealFib += it.fibreGrams;
    mealCost += it.costPkr;
  }

  const [updatedMeal] = await db
    .update(meals)
    .set({
      totalCalories: Math.round(mealCal * 10) / 10,
      totalProteinGrams: Math.round(mealPro * 10) / 10,
      totalCarbsGrams: Math.round(mealCarb * 10) / 10,
      totalFatGrams: Math.round(mealFat * 10) / 10,
      totalFibreGrams: Math.round(mealFib * 10) / 10,
      totalCostPkr: Math.round(mealCost * 10) / 10,
      updatedAt: new Date(),
    })
    .where(eq(meals.id, mealId))
    .returning();

  // Re-sum day plan
  const dayMeals = await db
    .select()
    .from(meals)
    .where(eq(meals.mealPlanId, updatedMeal.mealPlanId));

  let dayCal = 0;
  let dayPro = 0;
  let dayCarb = 0;
  let dayFat = 0;
  let dayFib = 0;
  let dayCost = 0;

  for (const m of dayMeals) {
    dayCal += m.totalCalories;
    dayPro += m.totalProteinGrams;
    dayCarb += m.totalCarbsGrams;
    dayFat += m.totalFatGrams;
    dayFib += m.totalFibreGrams;
    dayCost += m.totalCostPkr;
  }

  const [updatedDay] = await db
    .update(mealPlans)
    .set({
      totalCalories: Math.round(dayCal * 10) / 10,
      totalProteinGrams: Math.round(dayPro * 10) / 10,
      totalCarbsGrams: Math.round(dayCarb * 10) / 10,
      totalFatGrams: Math.round(dayFat * 10) / 10,
      totalFibreGrams: Math.round(dayFib * 10) / 10,
      totalCostPkr: Math.round(dayCost * 10) / 10,
      updatedAt: new Date(),
    })
    .where(eq(mealPlans.id, updatedMeal.mealPlanId))
    .returning();

  // Re-sum nutrition plan
  const [existingPlan] = await db
    .select()
    .from(nutritionPlans)
    .where(eq(nutritionPlans.id, updatedDay.nutritionPlanId))
    .limit(1);

  const isExceeded = updatedDay.totalCostPkr > existingPlan.dailyBudget;

  const [updatedPlan] = await db
    .update(nutritionPlans)
    .set({
      totalCalories: updatedDay.totalCalories,
      totalProteinGrams: updatedDay.totalProteinGrams,
      totalCarbsGrams: updatedDay.totalCarbsGrams,
      totalFatGrams: updatedDay.totalFatGrams,
      totalFibreGrams: updatedDay.totalFibreGrams,
      totalDailyCostPkr: updatedDay.totalCostPkr,
      isBudgetExceeded: isExceeded,
      updatedAt: new Date(),
    })
    .where(eq(nutritionPlans.id, updatedDay.nutritionPlanId))
    .returning();

  // Sync Grocery List
  await syncGroceryList(updatedPlan.id);

  return { updatedMeal, updatedPlan };
}

/**
 * Substitutes an individual food item in a meal with an alternative food.
 */
export async function substituteMealFood(
  mealId: string,
  mealFoodItemId: string,
  strategy: "cheaper" | "higher_protein" | "similar_macros" | "any",
  substituteFoodItemId?: string
): Promise<SubstituteResult> {
  const [existingItem] = await db
    .select()
    .from(mealFoodItems)
    .where(and(eq(mealFoodItems.id, mealFoodItemId), eq(mealFoodItems.mealId, mealId)))
    .limit(1);

  if (!existingItem) {
    throw new Error("Meal food item not found.");
  }

  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);
  if (!meal) throw new Error("Meal not found.");

  const [dayPlan] = await db.select().from(mealPlans).where(eq(mealPlans.id, meal.mealPlanId)).limit(1);
  const [plan] = await db
    .select()
    .from(nutritionPlans)
    .where(eq(nutritionPlans.id, dayPlan.nutritionPlanId))
    .limit(1);

  const { catalogForAI, foodMap, priceMap, categoryMap } = await getFoodCatalogWithPrices(
    plan.city
  );

  let candidateFood: typeof foodItems.$inferSelect | undefined;

  if (substituteFoodItemId) {
    candidateFood = foodMap.get(substituteFoodItemId);
  } else {
    // Determine current item category
    const currentFood = existingItem.foodItemId ? foodMap.get(existingItem.foodItemId) : undefined;
    const currentCategory = currentFood ? categoryMap.get(currentFood.categoryId) : undefined;

    const allCandidates = Array.from(foodMap.values()).filter(
      (f) => f.id !== existingItem.foodItemId
    );

    if (strategy === "cheaper") {
      // Prioritize same category foods with lower price or lower cost per 20g protein
      const sameCatCandidates = currentCategory
        ? allCandidates.filter((f) => categoryMap.get(f.categoryId) === currentCategory)
        : allCandidates;

      // If item was protein (e.g. chicken breast), prefer daal chana, farm eggs, or rajma
      if (
        currentCategory === "protein" ||
        existingItem.nameEn.toLowerCase().includes("chicken") ||
        existingItem.nameEn.toLowerCase().includes("beef") ||
        existingItem.nameEn.toLowerCase().includes("fish")
      ) {
        candidateFood =
          allCandidates.find((f) => f.nameEn.toLowerCase().includes("chana")) ||
          allCandidates.find((f) => f.nameEn.toLowerCase().includes("egg")) ||
          allCandidates.find((f) => f.nameEn.toLowerCase().includes("lentil")) ||
          sameCatCandidates[0];
      } else if (existingItem.nameEn.toLowerCase().includes("almond")) {
        candidateFood = allCandidates.find((f) => f.nameEn.toLowerCase().includes("peanut"));
      } else {
        // Find candidate with lowest price in priceMap
        const sorted = [...sameCatCandidates].sort((a, b) => {
          const prA = priceMap.get(a.id)?.price || 99999;
          const prB = priceMap.get(b.id)?.price || 99999;
          return prA - prB;
        });
        candidateFood = sorted[0];
      }
    } else if (strategy === "higher_protein") {
      const sorted = [...allCandidates].sort((a, b) => b.proteinPer100g - a.proteinPer100g);
      candidateFood = sorted[0];
    } else {
      // similar_macros
      const targetPro = existingItem.proteinGrams;
      const targetCal = existingItem.calories;
      const sorted = [...allCandidates].sort((a, b) => {
        const deltaA = Math.abs(a.proteinPer100g - (existingItem.proteinGrams / (existingItem.weightGrams / 100)));
        const deltaB = Math.abs(b.proteinPer100g - (existingItem.proteinGrams / (existingItem.weightGrams / 100)));
        return deltaA - deltaB;
      });
      candidateFood = sorted[0];
    }
  }

  if (!candidateFood) {
    throw new Error("No suitable substitute food found in the catalog.");
  }

  // Calculate equivalent quantity
  let newQuantity = existingItem.quantity;
  let newUnit = candidateFood.defaultServingUnit;

  if (candidateFood.defaultServingUnit === "piece") {
    newQuantity = Math.max(1, Math.round(existingItem.weightGrams / candidateFood.servingWeightGrams));
  } else if (candidateFood.defaultServingUnit === "g") {
    newQuantity = Math.max(25, Math.round(existingItem.weightGrams / 10) * 10);
  } else if (candidateFood.defaultServingUnit === "cup") {
    newQuantity = 1;
  }

  const basicFood: FoodNutritionBasics = {
    id: candidateFood.id,
    nameEn: candidateFood.nameEn,
    nameUr: candidateFood.nameUr,
    defaultServingSize: candidateFood.defaultServingSize,
    defaultServingUnit: candidateFood.defaultServingUnit,
    servingWeightGrams: candidateFood.servingWeightGrams,
    caloriesPer100g: candidateFood.caloriesPer100g,
    proteinPer100g: candidateFood.proteinPer100g,
    carbsPer100g: candidateFood.carbsPer100g,
    fatPer100g: candidateFood.fatPer100g,
    fibrePer100g: candidateFood.fibrePer100g,
  };

  const newNutrition = calculateFoodNutrition(basicFood, newQuantity, newUnit);
  const pr = priceMap.get(candidateFood.id);
  let newCost = 0;
  let priceSource = "Estimated";
  let isVerified = false;

  if (pr) {
    const costRes = calculateFoodCost(basicFood, newQuantity, newUnit, pr);
    newCost = costRes.totalCostPkr;
    priceSource = `${pr.marketRetailer} (${pr.city})`;
    isVerified = pr.verificationStatus === "verified";
  }

  const calDelta = Math.round((newNutrition.calories - existingItem.calories) * 10) / 10;
  const proDelta = Math.round((newNutrition.protein - existingItem.proteinGrams) * 10) / 10;
  const costDelta = Math.round((newCost - existingItem.costPkr) * 10) / 10;

  // Record substitution
  const [substitution] = await db
    .insert(foodSubstitutions)
    .values({
      mealId,
      originalFoodItemId: existingItem.foodItemId,
      substituteFoodItemId: candidateFood.id,
      originalNameEn: existingItem.nameEn,
      substituteNameEn: candidateFood.nameEn,
      calorieDelta: calDelta,
      proteinDelta: proDelta,
      costDeltaPkr: costDelta,
      reason: `Swapped via ${strategy} strategy (Cost: ${costDelta >= 0 ? "+" : ""}${costDelta} PKR, Protein: ${proDelta >= 0 ? "+" : ""}${proDelta}g)`,
    })
    .returning();

  // Update item
  await db
    .update(mealFoodItems)
    .set({
      foodItemId: candidateFood.id,
      nameEn: candidateFood.nameEn,
      nameUr: candidateFood.nameUr,
      quantity: newQuantity,
      unit: newUnit,
      weightGrams: newNutrition.weightGrams,
      calories: newNutrition.calories,
      proteinGrams: newNutrition.protein,
      carbsGrams: newNutrition.carbs,
      fatGrams: newNutrition.fat,
      fibreGrams: newNutrition.fibre,
      costPkr: newCost,
      priceSource,
      isVerifiedPrice: isVerified,
      updatedAt: new Date(),
    })
    .where(eq(mealFoodItems.id, mealFoodItemId));

  // Recalculate totals
  const { updatedMeal, updatedPlan } = await recalculateMealAndPlanTotals(mealId);
  const updatedItems = await db.select().from(mealFoodItems).where(eq(mealFoodItems.mealId, mealId));

  return {
    updatedMeal: { ...updatedMeal, items: updatedItems },
    updatedPlan,
    substitutionRecord: substitution,
  };
}

/**
 * Regenerates an entire single meal slot while keeping all other meals unchanged.
 */
export async function regenerateMealSlot(
  mealId: string,
  preference: "balanced" | "cheaper" | "higher_protein" | "quick_prep" = "balanced",
  customNotes?: string
): Promise<RegenerateMealResult> {
  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);
  if (!meal) throw new Error("Meal not found.");

  const [dayPlan] = await db.select().from(mealPlans).where(eq(mealPlans.id, meal.mealPlanId)).limit(1);
  const [plan] = await db
    .select()
    .from(nutritionPlans)
    .where(eq(nutritionPlans.id, dayPlan.nutritionPlanId))
    .limit(1);

  const { catalogForAI, foodMap, priceMap } = await getFoodCatalogWithPrices(plan.city);

  // 1. Try Groq AI single meal generation
  const aiMeal = await regenerateMealWithGroq(
    meal.mealType,
    meal.targetCalories || meal.totalCalories || 500,
    meal.totalProteinGrams || 30,
    preference,
    catalogForAI
  );

  let newNameEn = "";
  let newNameUr = "";
  let newPrepTime = 15;
  let newInstructions = "";
  let newRawItems: Array<{ foodItemId: string; quantity: number; unit: string }> = [];

  if (aiMeal) {
    newNameEn = aiMeal.nameEn;
    newNameUr = aiMeal.nameUr;
    newPrepTime = aiMeal.prepTimeMinutes;
    newInstructions = aiMeal.instructions;
    newRawItems = aiMeal.items;
  } else {
    // Deterministic alternative recipes based on slot and preference
    const findFood = (kw: string) =>
      Array.from(foodMap.values()).find((f) => f.nameEn.toLowerCase().includes(kw)) ||
      Array.from(foodMap.values())[0];

    if (meal.mealType === "breakfast") {
      if (preference === "cheaper") {
        const eggs = findFood("egg");
        const roti = findFood("roti") || findFood("wheat");
        newNameEn = "Two Hard-Boiled Farm Eggs & Tawa Roti";
        newNameUr = "دو ابلے ہوئے انڈے اور تازہ روٹی";
        newInstructions = "Boil farm eggs for 8-10 mins. Serve with fresh whole wheat chapati.";
        newRawItems = [
          { foodItemId: eggs.id, quantity: 2, unit: "piece" },
          { foodItemId: roti.id, quantity: 1, unit: "piece" },
        ];
      } else {
        const oats = findFood("oats") || findFood("dalia");
        const milk = findFood("milk");
        const banana = findFood("banana");
        newNameEn = "Warm Oatmeal Porridge (Dalia) with Banana & Milk";
        newNameUr = "دودھ اور کیلے کے ساتھ گرم دلیہ";
        newInstructions = "Simmer rolled oats in low-fat milk for 7 minutes. Top with freshly sliced banana.";
        newRawItems = [
          { foodItemId: oats.id, quantity: 1, unit: "cup" },
          { foodItemId: milk.id, quantity: 1, unit: "cup" },
          { foodItemId: banana.id, quantity: 1, unit: "piece" },
        ];
      }
    } else if (meal.mealType === "lunch" || meal.mealType === "dinner") {
      if (preference === "cheaper") {
        const daal = findFood("chana") || findFood("lentil");
        const rice = findFood("rice");
        const salad = findFood("cucumber") || findFood("tomato");
        newNameEn = "Desi Daal Chana with Fragrant Boiled Rice";
        newNameUr = "دال چنا اور ابلا ہوا باسمتی چاول";
        newInstructions = "Cook tempered yellow daal chana and serve hot over steamed basmati rice with cucumber salad.";
        newRawItems = [
          { foodItemId: daal.id, quantity: 180, unit: "g" },
          { foodItemId: rice.id, quantity: 1, unit: "cup" },
          { foodItemId: salad.id, quantity: 100, unit: "g" },
        ];
      } else {
        const chicken = findFood("chicken");
        const roti = findFood("roti") || findFood("wheat");
        const spinach = findFood("spinach") || findFood("palak");
        newNameEn = "Palak Chicken with Whole Wheat Roti";
        newNameUr = "پالک چکن اور تازہ چکی روٹی";
        newInstructions = "Cook tender chicken breast cubes with finely chopped spiced spinach and serve with 1 whole wheat roti.";
        newRawItems = [
          { foodItemId: chicken.id, quantity: 150, unit: "g" },
          { foodItemId: spinach.id, quantity: 1, unit: "cup" },
          { foodItemId: roti.id, quantity: 1, unit: "piece" },
        ];
      }
    } else {
      // Snack
      const yogurt = findFood("yogurt") || findFood("dahi");
      const apple = findFood("apple");
      newNameEn = "Chilled Low-Fat Dahi with Fresh Apple Slices";
      newNameUr = "ٹھنڈا دہی اور سیب";
      newInstructions = "Whisk fresh yogurt and top with thinly sliced crisp apples.";
      newRawItems = [
        { foodItemId: yogurt.id, quantity: 1, unit: "cup" },
        { foodItemId: apple.id, quantity: 1, unit: "piece" },
      ];
    }
  }

  // Delete old items for this meal
  await db.delete(mealFoodItems).where(eq(mealFoodItems.mealId, mealId));

  // Compute and insert new items deterministically
  for (const it of newRawItems) {
    const food = foodMap.get(it.foodItemId);
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

    const nut = calculateFoodNutrition(basicFood, it.quantity, it.unit);
    const pr = priceMap.get(food.id);
    let itemCost = 0;
    let priceSource = "Estimated";
    let isVerified = false;

    if (pr) {
      const cRes = calculateFoodCost(basicFood, it.quantity, it.unit, pr);
      itemCost = cRes.totalCostPkr;
      priceSource = `${pr.marketRetailer} (${pr.city})`;
      isVerified = pr.verificationStatus === "verified";
    }

    await db.insert(mealFoodItems).values({
      mealId,
      foodItemId: food.id,
      nameEn: food.nameEn,
      nameUr: food.nameUr,
      quantity: it.quantity,
      unit: it.unit,
      weightGrams: nut.weightGrams,
      calories: nut.calories,
      proteinGrams: nut.protein,
      carbsGrams: nut.carbs,
      fatGrams: nut.fat,
      fibreGrams: nut.fibre,
      costPkr: itemCost,
      priceSource,
      isVerifiedPrice: isVerified,
    });
  }

  // Update meal header
  await db
    .update(meals)
    .set({
      nameEn: newNameEn,
      nameUr: newNameUr,
      prepTimeMinutes: newPrepTime,
      instructions: newInstructions,
      updatedAt: new Date(),
    })
    .where(eq(meals.id, mealId));

  // Recalculate totals
  const { updatedMeal, updatedPlan } = await recalculateMealAndPlanTotals(mealId);
  const updatedItems = await db.select().from(mealFoodItems).where(eq(mealFoodItems.mealId, mealId));

  return {
    updatedMeal: { ...updatedMeal, items: updatedItems },
    updatedPlan,
  };
}

