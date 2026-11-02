import { db } from "@/db";
import {
  dailyFoodLogs,
  foodLogEntries,
  waterIntakeEntries,
  userWaterGoals,
  favouriteFoods,
  savedMeals,
  foodItems,
  nutritionPlans,
  mealPlans,
  meals,
  mealFoodItems,
  fitnessGoals,
  bodyAssessments,
  userProfiles,
  type DailyFoodLog,
  type FoodLogEntry,
  type WaterIntakeEntry,
} from "@/db/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import {
  calculateFoodNutrition,
  type FoodNutritionBasics,
} from "./nutrition-calculator";

// ============================================================================
// 1. DAILY LOG CONTAINER & TARGET RESOLUTION
// ============================================================================

export async function getOrCreateDailyLog(userId: string, logDate: string): Promise<DailyFoodLog> {
  // Check if daily log already exists for this date
  const [existing] = await db
    .select()
    .from(dailyFoodLogs)
    .where(and(eq(dailyFoodLogs.userId, userId), eq(dailyFoodLogs.logDate, logDate)))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Resolve user targets from active nutrition plan, or fitness goal, or standard fallback
  let targetCalories = 2000;
  let targetProtein = 125;
  let targetCarbs = 240;
  let targetFat = 60;
  let targetFibre = 30;

  // 1. Try active nutrition plan (Phase 4)
  const [activePlan] = await db
    .select()
    .from(nutritionPlans)
    .where(and(eq(nutritionPlans.userId, userId), eq(nutritionPlans.status, "active")))
    .orderBy(desc(nutritionPlans.createdAt))
    .limit(1);

  if (activePlan) {
    targetCalories = Math.round(activePlan.targetCalories || 2000);
    targetProtein = Math.round(activePlan.targetProteinGrams || 125);
    targetCarbs = Math.round(activePlan.targetCarbsGrams || 240);
    targetFat = Math.round(activePlan.targetFatGrams || 60);
    targetFibre = Math.round(activePlan.targetFibreGrams || 30);
  } else {
    // 2. Try user body assessment target (Phase 2)
    const [assessment] = await db
      .select()
      .from(bodyAssessments)
      .where(eq(bodyAssessments.userId, userId))
      .orderBy(desc(bodyAssessments.createdAt))
      .limit(1);

    if (assessment && assessment.targetCalories) {
      targetCalories = Math.round(assessment.targetCalories);
      targetProtein = Math.round(assessment.targetProteinGrams || (targetCalories * 0.25) / 4);
      targetCarbs = Math.round(assessment.targetCarbsGrams || (targetCalories * 0.5) / 4);
      targetFat = Math.round(assessment.targetFatGrams || (targetCalories * 0.25) / 9);
    }
  }

  const [created] = await db
    .insert(dailyFoodLogs)
    .values({
      userId,
      logDate,
      targetCalories,
      targetProteinGrams: targetProtein,
      targetCarbsGrams: targetCarbs,
      targetFatGrams: targetFat,
      targetFibreGrams: targetFibre,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFibreGrams: 0,
    })
    .returning();

  return created;
}

/**
 * Re-aggregates all logged food items for a daily log and updates parent totals.
 */
export async function recalculateDailyLogTotals(dailyLogId: string): Promise<DailyFoodLog> {
  const entries = await db
    .select()
    .from(foodLogEntries)
    .where(eq(foodLogEntries.dailyLogId, dailyLogId));

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFibre = 0;

  for (const e of entries) {
    totalCalories += e.calories;
    totalProtein += e.proteinGrams;
    totalCarbs += e.carbsGrams;
    totalFat += e.fatGrams;
    totalFibre += e.fibreGrams;
  }

  const [updated] = await db
    .update(dailyFoodLogs)
    .set({
      totalCalories: Math.round(totalCalories * 10) / 10,
      totalProteinGrams: Math.round(totalProtein * 10) / 10,
      totalCarbsGrams: Math.round(totalCarbs * 10) / 10,
      totalFatGrams: Math.round(totalFat * 10) / 10,
      totalFibreGrams: Math.round(totalFibre * 10) / 10,
      updatedAt: new Date(),
    })
    .where(eq(dailyFoodLogs.id, dailyLogId))
    .returning();

  return updated;
}

// ============================================================================
// 2. FOOD LOGGING ENGINE WITH NUTRITION SNAPSHOTS
// ============================================================================

export interface LogFoodParams {
  userId: string;
  logDate?: string;
  foodItemId?: string | null;
  mealCategory: "breakfast" | "lunch" | "dinner" | "snack";
  foodNameEn: string;
  foodNameUr?: string | null;
  quantity: number;
  unit: string;
  weightGrams?: number;
  plannedMealFoodItemId?: string | null;
  isFromMealPlan?: boolean;
  idempotencyKey?: string | null;
}

export async function logFoodItem(params: LogFoodParams): Promise<{
  entry: FoodLogEntry;
  dailyLog: DailyFoodLog;
  isDuplicateSkipped: boolean;
}> {
  const targetDate = params.logDate || new Date().toISOString().slice(0, 10);
  const dailyLog = await getOrCreateDailyLog(params.userId, targetDate);

  // Idempotency check: if an entry with this idempotency key already exists, return it
  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(foodLogEntries)
      .where(
        and(
          eq(foodLogEntries.userId, params.userId),
          eq(foodLogEntries.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);

    if (existing) {
      return { entry: existing, dailyLog, isDuplicateSkipped: true };
    }
  }

  let weightGrams = params.weightGrams || 100;
  let calories = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;
  let fibreGrams = 0;

  // If foodItemId is provided, calculate deterministic nutrition from DB
  if (params.foodItemId) {
    const [food] = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.id, params.foodItemId))
      .limit(1);

    if (food) {
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

      const calculated = calculateFoodNutrition(basicFood, params.quantity, params.unit);
      weightGrams = calculated.weightGrams;
      calories = calculated.calories;
      proteinGrams = calculated.protein;
      carbsGrams = calculated.carbs;
      fatGrams = calculated.fat;
      fibreGrams = calculated.fibre;
    }
  }

  // Insert food log entry with complete snapshot
  const [createdEntry] = await db
    .insert(foodLogEntries)
    .values({
      dailyLogId: dailyLog.id,
      userId: params.userId,
      foodItemId: params.foodItemId || null,
      mealCategory: params.mealCategory,
      foodNameEn: params.foodNameEn,
      foodNameUr: params.foodNameUr || null,
      quantity: params.quantity,
      unit: params.unit,
      weightGrams,
      calories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      fibreGrams,
      plannedMealFoodItemId: params.plannedMealFoodItemId || null,
      isFromMealPlan: params.isFromMealPlan || false,
      idempotencyKey: params.idempotencyKey || null,
    })
    .returning();

  // Update daily totals
  const updatedLog = await recalculateDailyLogTotals(dailyLog.id);

  return { entry: createdEntry, dailyLog: updatedLog, isDuplicateSkipped: false };
}

// ============================================================================
// 3. MEAL PLAN INTEGRATION & IDEMPOTENT IMPORT
// ============================================================================

export async function importPlannedMealsToDiary(params: {
  userId: string;
  date: string;
  nutritionPlanId?: string | null;
  mealPlanId?: string | null;
  mealId?: string | null;
  selectedFoodItemIds?: string[];
  confirmConsumed?: boolean;
}): Promise<{
  importedCount: number;
  skippedDuplicates: number;
  dailyLog: DailyFoodLog;
  entries: FoodLogEntry[];
}> {
  const dailyLog = await getOrCreateDailyLog(params.userId, params.date);

  // Find relevant meals
  let targetMeals: Array<typeof meals.$inferSelect> = [];

  if (params.mealId) {
    targetMeals = await db.select().from(meals).where(eq(meals.id, params.mealId));
  } else if (params.mealPlanId) {
    targetMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.mealPlanId, params.mealPlanId))
      .orderBy(meals.displayOrder);
  } else {
    // Find active nutrition plan's day 1 meal plan
    const [activePlan] = await db
      .select()
      .from(nutritionPlans)
      .where(
        and(
          eq(nutritionPlans.userId, params.userId),
          params.nutritionPlanId ? eq(nutritionPlans.id, params.nutritionPlanId) : eq(nutritionPlans.status, "active")
        )
      )
      .limit(1);

    if (activePlan) {
      const [mp] = await db
        .select()
        .from(mealPlans)
        .where(eq(mealPlans.nutritionPlanId, activePlan.id))
        .limit(1);

      if (mp) {
        targetMeals = await db
          .select()
          .from(meals)
          .where(eq(meals.mealPlanId, mp.id))
          .orderBy(meals.displayOrder);
      }
    }
  }

  if (targetMeals.length === 0) {
    return { importedCount: 0, skippedDuplicates: 0, dailyLog, entries: [] };
  }

  const mealIds = targetMeals.map((m) => m.id);

  // Fetch meal ingredients
  const allIngredients = await db
    .select()
    .from(mealFoodItems)
    .where(inArray(mealFoodItems.mealId, mealIds));

  let importedCount = 0;
  let skippedDuplicates = 0;
  const importedEntries: FoodLogEntry[] = [];

  for (const item of allIngredients) {
    // If selective import filter specified
    if (
      params.selectedFoodItemIds &&
      params.selectedFoodItemIds.length > 0 &&
      !params.selectedFoodItemIds.includes(item.id)
    ) {
      continue;
    }

    const parentMeal = targetMeals.find((m) => m.id === item.mealId);
    let category: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
    if (parentMeal?.mealType.includes("breakfast")) category = "breakfast";
    else if (parentMeal?.mealType.includes("lunch")) category = "lunch";
    else if (parentMeal?.mealType.includes("dinner")) category = "dinner";

    // Idempotency key per planned ingredient & date
    const idempotencyKey = `import_${item.id}_${params.date}`;

    const res = await logFoodItem({
      userId: params.userId,
      logDate: params.date,
      foodItemId: item.foodItemId,
      mealCategory: category,
      foodNameEn: item.nameEn,
      foodNameUr: item.nameUr,
      quantity: item.quantity,
      unit: item.unit,
      weightGrams: item.weightGrams,
      plannedMealFoodItemId: item.id,
      isFromMealPlan: true,
      idempotencyKey,
    });

    if (res.isDuplicateSkipped) {
      skippedDuplicates++;
    } else {
      importedCount++;
      importedEntries.push(res.entry);
    }
  }

  const updatedLog = await recalculateDailyLogTotals(dailyLog.id);

  return {
    importedCount,
    skippedDuplicates,
    dailyLog: updatedLog,
    entries: importedEntries,
  };
}

// ============================================================================
// 4. WATER TRACKING ENGINE
// ============================================================================

export async function logWater(
  userId: string,
  amountMl: number,
  logDate?: string
): Promise<{ entry: WaterIntakeEntry; dailyTotalMl: number; goalMl: number }> {
  const targetDate = logDate || new Date().toISOString().slice(0, 10);

  const [entry] = await db
    .insert(waterIntakeEntries)
    .values({
      userId,
      logDate: targetDate,
      amountMl,
    })
    .returning();

  // Get total for the day
  const dailyTotal = await getDailyWaterTotal(userId, targetDate);

  // Get goal
  const [goalRecord] = await db
    .select()
    .from(userWaterGoals)
    .where(eq(userWaterGoals.userId, userId))
    .limit(1);

  const goalMl = goalRecord ? goalRecord.dailyTargetMl : 2500;

  return { entry, dailyTotalMl: dailyTotal, goalMl };
}

export async function getDailyWaterTotal(userId: string, logDate: string): Promise<number> {
  const entries = await db
    .select()
    .from(waterIntakeEntries)
    .where(
      and(
        eq(waterIntakeEntries.userId, userId),
        eq(waterIntakeEntries.logDate, logDate)
      )
    );

  return entries.reduce((sum, e) => sum + e.amountMl, 0);
}

// ============================================================================
// 5. DAILY SUMMARY & MEAL CATEGORY AGGREGATION
// ============================================================================

export async function getDailySummary(userId: string, logDate: string) {
  const dailyLog = await getOrCreateDailyLog(userId, logDate);

  // Fetch all entries for this date
  const entries = await db
    .select({
      entry: foodLogEntries,
      food: foodItems,
    })
    .from(foodLogEntries)
    .leftJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
    .where(eq(foodLogEntries.dailyLogId, dailyLog.id))
    .orderBy(desc(foodLogEntries.loggedAt));

  // Compute breakdown by meal category
  const categories = ["breakfast", "lunch", "dinner", "snack"] as const;
  const mealBreakdown: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      itemsCount: number;
      items: any[];
    }
  > = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, itemsCount: 0, items: [] },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, itemsCount: 0, items: [] },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, itemsCount: 0, items: [] },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0, itemsCount: 0, items: [] },
  };

  for (const row of entries) {
    const cat = row.entry.mealCategory;
    if (mealBreakdown[cat]) {
      mealBreakdown[cat].calories += row.entry.calories;
      mealBreakdown[cat].protein += row.entry.proteinGrams;
      mealBreakdown[cat].carbs += row.entry.carbsGrams;
      mealBreakdown[cat].fat += row.entry.fatGrams;
      mealBreakdown[cat].itemsCount += 1;
      mealBreakdown[cat].items.push({
        ...row.entry,
        foodImage: row.food?.image || null,
      });
    }
  }

  // Round breakdown values
  for (const cat of categories) {
    mealBreakdown[cat].calories = Math.round(mealBreakdown[cat].calories);
    mealBreakdown[cat].protein = Math.round(mealBreakdown[cat].protein * 10) / 10;
    mealBreakdown[cat].carbs = Math.round(mealBreakdown[cat].carbs * 10) / 10;
    mealBreakdown[cat].fat = Math.round(mealBreakdown[cat].fat * 10) / 10;
  }

  // Fetch water intake
  const waterTotalMl = await getDailyWaterTotal(userId, logDate);
  const [waterGoal] = await db
    .select()
    .from(userWaterGoals)
    .where(eq(userWaterGoals.userId, userId))
    .limit(1);
  const waterTargetMl = waterGoal ? waterGoal.dailyTargetMl : 2500;

  // Targets & Remainder
  const remainingCalories = Math.round(dailyLog.targetCalories - dailyLog.totalCalories);
  const remainingProtein = Math.round((dailyLog.targetProteinGrams - dailyLog.totalProteinGrams) * 10) / 10;
  const remainingCarbs = Math.round((dailyLog.targetCarbsGrams - dailyLog.totalCarbsGrams) * 10) / 10;
  const remainingFat = Math.round((dailyLog.targetFatGrams - dailyLog.totalFatGrams) * 10) / 10;

  // Percentage completion
  const caloriePercent = Math.min(200, Math.round((dailyLog.totalCalories / dailyLog.targetCalories) * 100));
  const proteinPercent = Math.min(200, Math.round((dailyLog.totalProteinGrams / dailyLog.targetProteinGrams) * 100));
  const carbsPercent = Math.min(200, Math.round((dailyLog.totalCarbsGrams / dailyLog.targetCarbsGrams) * 100));
  const fatPercent = Math.min(200, Math.round((dailyLog.totalFatGrams / dailyLog.targetFatGrams) * 100));
  const waterPercent = Math.min(200, Math.round((waterTotalMl / waterTargetMl) * 100));

  return {
    dailyLog,
    totals: {
      calories: Math.round(dailyLog.totalCalories),
      protein: Math.round(dailyLog.totalProteinGrams * 10) / 10,
      carbs: Math.round(dailyLog.totalCarbsGrams * 10) / 10,
      fat: Math.round(dailyLog.totalFatGrams * 10) / 10,
      fibre: Math.round(dailyLog.totalFibreGrams * 10) / 10,
    },
    targets: {
      calories: Math.round(dailyLog.targetCalories),
      protein: Math.round(dailyLog.targetProteinGrams),
      carbs: Math.round(dailyLog.targetCarbsGrams),
      fat: Math.round(dailyLog.targetFatGrams),
      fibre: Math.round(dailyLog.targetFibreGrams),
    },
    remaining: {
      calories: remainingCalories,
      protein: remainingProtein,
      carbs: remainingCarbs,
      fat: remainingFat,
    },
    percentages: {
      calorie: caloriePercent,
      protein: proteinPercent,
      carbs: carbsPercent,
      fat: fatPercent,
      water: waterPercent,
    },
    water: {
      totalMl: waterTotalMl,
      targetMl: waterTargetMl,
      percentage: waterPercent,
      totalLitres: Math.round((waterTotalMl / 1000) * 10) / 10,
      targetLitres: Math.round((waterTargetMl / 1000) * 10) / 10,
    },
    mealBreakdown,
    totalLoggedItems: entries.length,
  };
}

// ============================================================================
// 6. REALISTIC, DETERMINISTIC NUTRITION INSIGHTS
// ============================================================================

export interface NutritionInsight {
  type: "warning" | "success" | "info" | "tip";
  titleEn: string;
  titleUr: string;
  messageEn: string;
  messageUr: string;
}

export async function calculateNutritionInsights(
  userId: string,
  logDate: string
): Promise<NutritionInsight[]> {
  const summary = await getDailySummary(userId, logDate);
  const insights: NutritionInsight[] = [];

  // 1. Missing Meal Check
  const { mealBreakdown } = summary;
  const missingMeals: string[] = [];
  if (mealBreakdown.breakfast.itemsCount === 0) missingMeals.push("Breakfast");
  if (mealBreakdown.lunch.itemsCount === 0) missingMeals.push("Lunch");
  if (mealBreakdown.dinner.itemsCount === 0) missingMeals.push("Dinner");

  if (missingMeals.length > 0 && missingMeals.length < 3) {
    insights.push({
      type: "info",
      titleEn: `Unlogged Meals Today (${missingMeals.join(", ")})`,
      titleUr: `آج کی غیر درج شدہ خوراک (${missingMeals.join(", ")})`,
      messageEn: `You have not yet logged ${missingMeals.join(" or ")} for ${logDate}. Log your intake to keep daily calorie tracking accurate.`,
      messageUr: `آپ نے ${logDate} کے لیے ${missingMeals.join(" یا ")} ابھی درج نہیں کیے۔ درست نتائج کے لیے کھانا درج کریں۔`,
    });
  }

  // 2. Protein Intake Insight
  const proteinGap = summary.targets.protein - summary.totals.protein;
  if (proteinGap > 25) {
    insights.push({
      type: "warning",
      titleEn: `Protein Deficit (${Math.round(proteinGap)}g Below Target)`,
      titleUr: `پروٹین کی کمی (ہدف سے ${Math.round(proteinGap)} گرام کم)`,
      messageEn: `Your protein intake is currently ${Math.round(proteinGap)}g below your target. Consider incorporating eggs, chicken breast, or lentils (daal) in your next meal.`,
      messageUr: `آپ کا پروٹین ہدف سے ${Math.round(proteinGap)} گرام کم ہے۔ اگلے کھانے میں انڈے، چکن یا دال شامل کرنے پر غور کریں۔`,
    });
  } else if (summary.totals.protein >= summary.targets.protein) {
    insights.push({
      type: "success",
      titleEn: "Protein Target Achieved",
      titleUr: "پروٹین کا ہدف مکمل",
      messageEn: `Excellent work! You reached your daily protein goal (${summary.totals.protein}g / ${summary.targets.protein}g), supporting lean muscle recovery.`,
      messageUr: `بہترین! آپ نے آج کا پروٹین ہدف مکمل کر لیا (${summary.totals.protein} گرام)، جو پٹھوں کی بحالی میں مددگار ہے۔`,
    });
  }

  // 3. Calorie Balance Insight
  const calorieDiff = summary.totals.calories - summary.targets.calories;
  if (calorieDiff > 250) {
    insights.push({
      type: "warning",
      titleEn: `Caloric Surplus (${Math.round(calorieDiff)} kcal Above Target)`,
      titleUr: `اضافی کیلوریز (ہدف سے ${Math.round(calorieDiff)} زیادہ)`,
      messageEn: `You have exceeded your daily calorie target by ${Math.round(calorieDiff)} kcal. Adjust your evening portion sizes or snacks accordingly.`,
      messageUr: `آپ کی کیلوریز روزانہ ہدف سے ${Math.round(calorieDiff)} بڑھ چکی ہیں۔ شام کے کھانے یا اسنیکس میں توازن رکھیں۔`,
    });
  } else if (Math.abs(calorieDiff) <= 150 && summary.totals.calories > 0) {
    insights.push({
      type: "success",
      titleEn: "Optimal Caloric Accuracy",
      titleUr: "بہترین کیلوری توازن",
      messageEn: "Your energy intake is tightly aligned within your daily nutritional target.",
      messageUr: "آپ کی یومیہ خوراک مطلوبہ غذائی ہدف کے بالکل مطابق ہے۔",
    });
  }

  // 4. Hydration Insight
  if (summary.water.percentage < 50) {
    const remainingMl = summary.water.targetMl - summary.water.totalMl;
    insights.push({
      type: "tip",
      titleEn: `Hydration Reminder (${remainingMl} ml Remaining)`,
      titleUr: `پانی پینے کی یاد دہانی (${remainingMl} ملی لیٹر باقی)`,
      messageEn: `You have logged ${summary.water.totalLitres}L of water today (${summary.water.percentage}% of your ${summary.water.targetLitres}L goal). Remember to drink water regularly throughout the day.`,
      messageUr: `آپ نے آج ${summary.water.totalLitres} لیٹر پانی درج کیا۔ دن بھر مناسب مقدار میں پانی پینا جاری رکھیں۔`,
    });
  } else if (summary.water.percentage >= 100) {
    insights.push({
      type: "success",
      titleEn: "Hydration Goal Completed",
      titleUr: "پانی کا ہدف مکمل",
      messageEn: `You met your daily hydration target of ${summary.water.targetLitres}L. Great job maintaining optimal fluid intake!`,
      messageUr: `آپ نے روزانہ ${summary.water.targetLitres} لیٹر پانی کا ہدف حاصل کر لیا۔ بہت خوب!`,
    });
  }

  return insights;
}

// ============================================================================
// 7. QUICK LOGGING HELPERS: FREQUENT, RECENT & FAVOURITES
// ============================================================================

export async function getQuickFoods(userId: string) {
  // 1. Favourites
  const favourites = await db
    .select({
      id: favouriteFoods.id,
      foodItemId: favouriteFoods.foodItemId,
      customServingSize: favouriteFoods.customServingSize,
      customServingUnit: favouriteFoods.customServingUnit,
      food: foodItems,
    })
    .from(favouriteFoods)
    .innerJoin(foodItems, eq(favouriteFoods.foodItemId, foodItems.id))
    .where(eq(favouriteFoods.userId, userId))
    .orderBy(desc(favouriteFoods.createdAt))
    .limit(10);

  // 2. Recent foods logged in last 14 days
  const recentLogs = await db
    .select({
      foodItemId: foodLogEntries.foodItemId,
      foodNameEn: foodLogEntries.foodNameEn,
      foodNameUr: foodLogEntries.foodNameUr,
      unit: foodLogEntries.unit,
      quantity: foodLogEntries.quantity,
      weightGrams: foodLogEntries.weightGrams,
      calories: foodLogEntries.calories,
      proteinGrams: foodLogEntries.proteinGrams,
      carbsGrams: foodLogEntries.carbsGrams,
      fatGrams: foodLogEntries.fatGrams,
      loggedAt: foodLogEntries.loggedAt,
    })
    .from(foodLogEntries)
    .where(eq(foodLogEntries.userId, userId))
    .orderBy(desc(foodLogEntries.loggedAt))
    .limit(20);

  // Deduplicate recent foods by name
  const seenRecent = new Set<string>();
  const recentDeduplicated = [];
  for (const r of recentLogs) {
    if (!seenRecent.has(r.foodNameEn)) {
      seenRecent.add(r.foodNameEn);
      recentDeduplicated.push(r);
    }
  }

  // 3. Saved Meals
  const userSavedMeals = await db
    .select()
    .from(savedMeals)
    .where(eq(savedMeals.userId, userId))
    .orderBy(desc(savedMeals.createdAt))
    .limit(10);

  return {
    favourites: favourites.map((f) => ({
      ...f,
      food: f.food,
    })),
    recent: recentDeduplicated.slice(0, 8),
    savedMeals: userSavedMeals,
  };
}
