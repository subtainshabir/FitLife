/**
 * FitLife AI: Core Fitness & Biometric Calculation Service (Phase 2)
 *
 * Deterministic, evidence-based calculations executed strictly on the server:
 * - Metric/Imperial conversions (kg/lbs, cm/ft-in)
 * - BMI (Body Mass Index) with adult categories & minor safeguards
 * - BMR (Basal Metabolic Rate) via Mifflin-St Jeor equation
 * - TDEE (Total Daily Energy Expenditure) with activity multipliers
 * - Nutrition Targets (Macro split: Protein, Carbs, Fats)
 * - Goal Timeline & Safe Rate Verification
 */

export type BiologicalSex = "male" | "female" | "other" | "prefer_not_to_say";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type FitnessGoalType =
  | "weight_loss"
  | "fat_reduction"
  | "weight_gain"
  | "muscle_building"
  | "weight_maintenance"
  | "body_recomposition"
  | "strength_improvement"
  | "endurance"
  | "general_fitness";

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese_1"
  | "obese_2"
  | "obese_3"
  | "pediatric_minor";

// ---------------------------------------------------------------------------
// 1. UNIT CONVERSIONS
// ---------------------------------------------------------------------------

export const LBS_PER_KG = 2.20462262185;
export const CM_PER_INCH = 2.54;

export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * CM_PER_INCH * 10) / 10;
}

// ---------------------------------------------------------------------------
// 2. BMI CALCULATION
// ---------------------------------------------------------------------------

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  categoryLabel: string;
  isMinor: boolean;
  explanation: string;
  disclaimer: string;
  healthyWeightRangeKg: { min: number; max: number };
}

export function calculateBmi(weightKg: number, heightCm: number, age?: number): BmiResult {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error("Weight and height must be greater than zero.");
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  const isMinor = age !== undefined && age < 18;

  let category: BmiCategory;
  let categoryLabel: string;

  if (isMinor) {
    category = "pediatric_minor";
    categoryLabel = "Pediatric / Minor (<18)";
  } else if (bmi < 18.5) {
    category = "underweight";
    categoryLabel = "Underweight";
  } else if (bmi < 25.0) {
    category = "normal";
    categoryLabel = "Normal Weight";
  } else if (bmi < 30.0) {
    category = "overweight";
    categoryLabel = "Overweight";
  } else if (bmi < 35.0) {
    category = "obese_1";
    categoryLabel = "Obesity Class I";
  } else if (bmi < 40.0) {
    category = "obese_2";
    categoryLabel = "Obesity Class II";
  } else {
    category = "obese_3";
    categoryLabel = "Obesity Class III";
  }

  // Healthy BMI range for adults is 18.5 - 24.9
  const minHealthyWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxHealthyWeight = Math.round(24.9 * heightM * heightM * 10) / 10;

  return {
    bmi,
    category,
    categoryLabel,
    isMinor,
    explanation: isMinor
      ? "For individuals under 18 years of age, standard adult BMI cutoffs do not apply. Pediatric growth percentiles (CDC/WHO) are used clinically to evaluate growth and development."
      : `Your BMI is ${bmi}, placing you in the ${categoryLabel} category. A standard healthy adult BMI range is 18.5 to 24.9.`,
    disclaimer:
      "BMI is a screening measure calculated from height and weight. It is not a direct measurement of body fat, muscle composition, or overall cardiovascular and metabolic health.",
    healthyWeightRangeKg: {
      min: minHealthyWeight,
      max: maxHealthyWeight,
    },
  };
}

// ---------------------------------------------------------------------------
// 3. BMR CALCULATION (Mifflin-St Jeor)
// ---------------------------------------------------------------------------

export interface BmrResult {
  bmr: number;
  formula: string;
  explanation: string;
  inputsUsed: {
    weightKg: number;
    heightCm: number;
    age: number;
    gender: BiologicalSex | string;
    assumedSex: boolean;
  };
  sexExplanation: string;
}

export const BIOLOGICAL_SEX_EXPLANATION =
  "Biological sex is requested strictly for metabolic calculation accuracy. Evidence-based physiological formulas (such as Mifflin-St Jeor) incorporate baseline differences in lean muscle-to-fat mass ratio. When omitted or marked as other/prefer not to say, a gender-neutral midpoint average is applied.";

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender?: BiologicalSex | string
): BmrResult {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    throw new Error("Weight, height, and age must be positive values.");
  }

  // Base equation: 10 * weight (kg) + 6.25 * height (cm) - 5 * age (years)
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  let bmr: number;
  let formula: string;
  let assumedSex = false;
  const normalizedSex = (gender || "").toLowerCase();

  if (normalizedSex === "male") {
    bmr = Math.round(base + 5);
    formula = "Mifflin-St Jeor (Male): 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5";
  } else if (normalizedSex === "female") {
    bmr = Math.round(base - 161);
    formula = "Mifflin-St Jeor (Female): 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161";
  } else {
    // Gender-neutral midpoint average between +5 and -161 (-78)
    bmr = Math.round(base - 78);
    formula =
      "Mifflin-St Jeor (Gender-Neutral Midpoint): 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 78";
    assumedSex = true;
  }

  return {
    bmr,
    formula,
    explanation: `Your Basal Metabolic Rate (BMR) is estimated at ${bmr} calories per day. This is the baseline energy your body expends at complete rest to sustain vital organ functions.`,
    inputsUsed: {
      weightKg,
      heightCm,
      age,
      gender: gender || "prefer_not_to_say",
      assumedSex,
    },
    sexExplanation: BIOLOGICAL_SEX_EXPLANATION,
  };
}

// ---------------------------------------------------------------------------
// 4. TDEE CALCULATION
// ---------------------------------------------------------------------------

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string; description: string }> = {
  sedentary: {
    multiplier: 1.2,
    label: "Sedentary",
    description: "Little to no exercise, desk job",
  },
  lightly_active: {
    multiplier: 1.375,
    label: "Lightly Active",
    description: "Light exercise or sports 1-3 days per week",
  },
  moderately_active: {
    multiplier: 1.55,
    label: "Moderately Active",
    description: "Moderate exercise or sports 3-5 days per week",
  },
  very_active: {
    multiplier: 1.725,
    label: "Very Active",
    description: "Intense exercise or sports 6-7 days per week",
  },
  extra_active: {
    multiplier: 1.9,
    label: "Extra Active",
    description: "Very intense daily exercise or physical labor / two-a-days",
  },
};

export interface TdeeResult {
  tdee: number;
  activityLevel: ActivityLevel;
  activityMultiplier: number;
  activityLabel: string;
  activityDescription: string;
  explanation: string;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): TdeeResult {
  const config = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderately_active;
  const tdee = Math.round(bmr * config.multiplier);

  return {
    tdee,
    activityLevel,
    activityMultiplier: config.multiplier,
    activityLabel: config.label,
    activityDescription: config.description,
    explanation: `Your Total Daily Energy Expenditure (TDEE) is estimated at ${tdee} kcal/day. This represents your estimated daily maintenance calories based on your activity factor (${config.multiplier}×).`,
  };
}

// ---------------------------------------------------------------------------
// 5. NUTRITION TARGETS CALCULATION
// ---------------------------------------------------------------------------

export interface MacroTarget {
  grams: number;
  calories: number;
  percentage: number;
}

export interface NutritionTargetsResult {
  dailyCalories: number;
  calorieAdjustment: number;
  calorieAdjustmentReason: string;
  protein: MacroTarget;
  carbs: MacroTarget;
  fat: MacroTarget;
  isRestrictedMinFloor: boolean;
  minCalorieFloor: number;
  explanation: string;
  disclaimer: string;
  safetyWarnings: string[];
}

export function calculateNutritionTargets(
  tdee: number,
  weightKg: number,
  goal: FitnessGoalType,
  gender?: BiologicalSex | string,
  age?: number,
  healthConditions?: string[],
  isPregnant?: boolean
): NutritionTargetsResult {
  const safetyWarnings: string[] = [];

  // Minimum safe daily calorie floors
  const normalizedSex = (gender || "").toLowerCase();
  const minCalorieFloor =
    normalizedSex === "female" ? 1200 : normalizedSex === "male" ? 1500 : 1350;

  // Calorie adjustments based on primary fitness goal
  let calorieAdjustment = 0;
  let calorieAdjustmentReason = "Maintenance calories to sustain current weight and activity.";
  let proteinPerKg = 1.6; // default g/kg

  switch (goal) {
    case "weight_loss":
      calorieAdjustment = -450;
      calorieAdjustmentReason = "Calorie deficit of ~450 kcal/day targeted for safe weight loss (~0.4 kg/week).";
      proteinPerKg = 1.8;
      break;
    case "fat_reduction":
      calorieAdjustment = -350;
      calorieAdjustmentReason = "Moderate deficit with higher protein to maximize fat oxidation while preserving lean mass.";
      proteinPerKg = 2.0;
      break;
    case "weight_gain":
      calorieAdjustment = 400;
      calorieAdjustmentReason = "Caloric surplus of +400 kcal/day to support steady, healthy weight gain.";
      proteinPerKg = 1.6;
      break;
    case "muscle_building":
      calorieAdjustment = 300;
      calorieAdjustmentReason = "Caloric surplus of +300 kcal/day optimized for lean muscle protein synthesis.";
      proteinPerKg = 2.0;
      break;
    case "body_recomposition":
      calorieAdjustment = -150;
      calorieAdjustmentReason = "Slight deficit with high protein to simultaneously shed body fat and build muscle.";
      proteinPerKg = 2.2;
      break;
    case "strength_improvement":
      calorieAdjustment = 150;
      calorieAdjustmentReason = "Slight surplus with high protein to fuel maximal neuromuscular recovery.";
      proteinPerKg = 1.9;
      break;
    case "endurance":
      calorieAdjustment = 100;
      calorieAdjustmentReason = "Slight surplus with emphasis on glycogen replenishment.";
      proteinPerKg = 1.4;
      break;
    case "general_fitness":
    case "weight_maintenance":
    default:
      calorieAdjustment = 0;
      calorieAdjustmentReason = "Maintenance calories to maintain current weight and energy levels.";
      proteinPerKg = 1.5;
      break;
  }

  // Safety checks for minors, pregnancy, and medical restrictions
  const isMinor = age !== undefined && age < 18;
  if (isMinor) {
    safetyWarnings.push(
      "Safeguard Alert: Users under 18 years of age require adequate energy and nutrient intake for active growth and development. Calorie restriction is not recommended without pediatrician supervision."
    );
    if (calorieAdjustment < 0) {
      calorieAdjustment = 0;
      calorieAdjustmentReason = "Calorie deficit neutralized: minors require maintenance or growth-supportive caloric intake.";
    }
  }

  if (isPregnant) {
    safetyWarnings.push(
      "Pregnancy Safeguard: Calorie deficits are strictly not recommended during pregnancy. Energy requirements typically increase during the 2nd and 3rd trimesters. Please consult an obstetrician or registered dietitian."
    );
    if (calorieAdjustment < 0) {
      calorieAdjustment = 300;
      calorieAdjustmentReason = "Deficit overridden for maternal health and fetal development.";
    }
  }

  if (healthConditions && healthConditions.length > 0) {
    safetyWarnings.push(
      `Disclosed health factors (${healthConditions.join(", ")}): Consult a qualified physician or registered dietitian before adopting structured caloric or macronutrient targets.`
    );
  }

  // Calculate target calories and apply safety floor
  let rawCalories = tdee + calorieAdjustment;
  let isRestrictedMinFloor = false;

  if (rawCalories < minCalorieFloor) {
    rawCalories = minCalorieFloor;
    isRestrictedMinFloor = true;
    safetyWarnings.push(
      `Safety Floor Applied: Daily intake was clamped to the absolute physiological minimum of ${minCalorieFloor} kcal/day to prevent metabolic slowdown, micronutrient deficiencies, and gallstone risk.`
    );
  }

  const dailyCalories = Math.round(rawCalories);

  // Protein calculation: grams based on bodyweight, clamped within 15-35% of total calories
  let proteinGrams = Math.round(weightKg * proteinPerKg);
  // Cap protein grams to max 2.5 g/kg or 35% of daily calories
  const maxProteinGrams = Math.min(Math.round(weightKg * 2.5), Math.round((dailyCalories * 0.35) / 4));
  const minProteinGrams = Math.round((dailyCalories * 0.15) / 4);
  proteinGrams = Math.max(minProteinGrams, Math.min(proteinGrams, maxProteinGrams));
  const proteinCalories = proteinGrams * 4;

  // Fat calculation: 25% - 30% of total calories (minimum 0.6 g/kg for hormonal health)
  const minFatGrams = Math.round(weightKg * 0.6);
  let fatCalories = Math.round(dailyCalories * (goal === "endurance" ? 0.22 : 0.27));
  let fatGrams = Math.round(fatCalories / 9);
  if (fatGrams < minFatGrams) {
    fatGrams = minFatGrams;
    fatCalories = fatGrams * 9;
  }

  // Carbohydrate calculation: Remaining calories
  let carbCalories = Math.max(0, dailyCalories - (proteinCalories + fatCalories));
  let carbGrams = Math.round(carbCalories / 4);

  // Recalculate exact percentages
  const totalMacroCalories = proteinCalories + fatCalories + carbCalories;
  const proteinPercent = Math.round((proteinCalories / totalMacroCalories) * 100);
  const fatPercent = Math.round((fatCalories / totalMacroCalories) * 100);
  const carbPercent = Math.max(0, 100 - (proteinPercent + fatPercent));

  return {
    dailyCalories,
    calorieAdjustment,
    calorieAdjustmentReason,
    protein: {
      grams: proteinGrams,
      calories: proteinCalories,
      percentage: proteinPercent,
    },
    carbs: {
      grams: carbGrams,
      calories: carbCalories,
      percentage: carbPercent,
    },
    fat: {
      grams: fatGrams,
      calories: fatCalories,
      percentage: fatPercent,
    },
    isRestrictedMinFloor,
    minCalorieFloor,
    explanation: `Estimated initial targets: ${dailyCalories} kcal/day (${proteinGrams}g Protein, ${carbGrams}g Carbs, ${fatGrams}g Fat). These targets are mathematically derived to support your ${goal.replace(/_/g, " ")} objective.`,
    disclaimer:
      "All caloric and macronutrient targets are evidence-based estimates. Individual energy requirements vary with hormonal profile, non-exercise thermogenesis, and training volume. This application does not prescribe medical nutrition therapy.",
    safetyWarnings,
  };
}

// ---------------------------------------------------------------------------
// 6. GOAL TIMELINE & SAFE RATE VALIDATOR
// ---------------------------------------------------------------------------

export interface GoalTimelineResult {
  currentWeightKg: number;
  targetWeightKg: number;
  weightDifferenceKg: number;
  targetRateKgPerWeek: number;
  isWeightChangeGoal: boolean;
  estimatedWeeks: number;
  startDate: Date;
  estimatedCompletionDate: Date;
  isSafeRate: boolean;
  safeRateRecommendation: string;
  warnings: string[];
}

export function calculateGoalTimeline(
  currentWeightKg: number,
  targetWeightKg: number | undefined,
  targetRateKgPerWeek: number | undefined,
  startDateInput?: Date | string,
  heightCm?: number,
  age?: number
): GoalTimelineResult {
  const startDate = startDateInput ? new Date(startDateInput) : new Date();
  const warnings: string[] = [];

  if (targetWeightKg === undefined || targetWeightKg === null) {
    return {
      currentWeightKg,
      targetWeightKg: currentWeightKg,
      weightDifferenceKg: 0,
      targetRateKgPerWeek: 0,
      isWeightChangeGoal: false,
      estimatedWeeks: 0,
      startDate,
      estimatedCompletionDate: startDate,
      isSafeRate: true,
      safeRateRecommendation: "Non-weight-specific goal or maintenance.",
      warnings,
    };
  }

  const weightDiff = Math.abs(currentWeightKg - targetWeightKg);
  const isLoss = targetWeightKg < currentWeightKg;
  const isGain = targetWeightKg > currentWeightKg;

  // Default safe rates: loss 0.5 kg/week, gain 0.3 kg/week
  const rate = targetRateKgPerWeek && targetRateKgPerWeek > 0
    ? targetRateKgPerWeek
    : isLoss
    ? 0.5
    : 0.3;

  let isSafeRate = true;
  let safeRateRecommendation = "";

  if (isLoss) {
    if (rate > 1.0) {
      isSafeRate = false;
      warnings.push(
        "Rate Warning: Weight loss exceeding 1.0 kg (2.2 lbs) per week is considered aggressive and risks lean muscle loss, metabolic slowdown, and gallstones."
      );
      safeRateRecommendation = "We recommend a sustainable weight loss rate between 0.25 kg and 0.75 kg (0.5 - 1.5 lbs) per week.";
    } else {
      safeRateRecommendation = "Your chosen weight loss rate (≤1.0 kg/week) is within safe, evidence-based parameters.";
    }
  } else if (isGain) {
    if (rate > 0.5) {
      isSafeRate = false;
      warnings.push(
        "Rate Warning: Weight gain exceeding 0.5 kg (1.1 lbs) per week typically results in disproportionate adipose accumulation rather than lean muscle."
      );
      safeRateRecommendation = "We recommend a lean gaining rate between 0.25 kg and 0.5 kg per week.";
    } else {
      safeRateRecommendation = "Your chosen rate is optimized for lean tissue accretion.";
    }
  } else {
    safeRateRecommendation = "Maintenance goal: Weight target matches current weight.";
  }

  // Target weight safety check with height (BMI check)
  if (heightCm && heightCm > 0) {
    const targetBmi = targetWeightKg / Math.pow(heightCm / 100, 2);
    if (targetBmi < 18.5) {
      warnings.push(
        `Critical Health Warning: Your target weight of ${targetWeightKg} kg corresponds to a BMI of ${Math.round(targetBmi * 10) / 10}, which is below the healthy adult threshold (<18.5). We strongly advise against aiming for an underweight BMI.`
      );
      isSafeRate = false;
    }
  }

  // Safeguards for minors
  if (age !== undefined && age < 18 && (isLoss || rate > 0.5)) {
    warnings.push(
      "Pediatric Notice: Active weight reduction regimens in adolescents should only be undertaken under direct physician or registered dietitian guidance."
    );
  }

  const estimatedWeeks = rate > 0 ? Math.ceil((weightDiff / rate) * 10) / 10 : 0;
  const estimatedCompletionDate = new Date(startDate.getTime() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000);

  return {
    currentWeightKg,
    targetWeightKg,
    weightDifferenceKg: Math.round(weightDiff * 10) / 10,
    targetRateKgPerWeek: rate,
    isWeightChangeGoal: isLoss || isGain,
    estimatedWeeks,
    startDate,
    estimatedCompletionDate,
    isSafeRate,
    safeRateRecommendation,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 7. COMPREHENSIVE ASSESSMENT SUITE
// ---------------------------------------------------------------------------

export interface FullAssessmentParams {
  weightKg: number;
  heightCm: number;
  age: number;
  gender?: BiologicalSex | string;
  activityLevel: ActivityLevel;
  fitnessExperience?: string;
  primaryGoal: FitnessGoalType;
  healthConditions?: string[];
  isPregnant?: boolean;
}

export interface FullAssessmentResult {
  bmi: BmiResult;
  bmr: BmrResult;
  tdee: TdeeResult;
  nutrition: NutritionTargetsResult;
  inputs: {
    weightKg: number;
    heightCm: number;
    age: number;
    gender: string;
    activityLevel: ActivityLevel;
    fitnessExperience: string;
    primaryGoal: FitnessGoalType;
  };
  summary: {
    bmi: number;
    bmiCategory: BmiCategory;
    bmr: number;
    tdee: number;
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    isMinor: boolean;
    hasHealthWarning: boolean;
  };
}

export function calculateFullAssessment(params: FullAssessmentParams): FullAssessmentResult {
  const {
    weightKg,
    heightCm,
    age,
    gender,
    activityLevel,
    fitnessExperience = "beginner",
    primaryGoal,
    healthConditions,
    isPregnant,
  } = params;

  const bmiResult = calculateBmi(weightKg, heightCm, age);
  const bmrResult = calculateBmr(weightKg, heightCm, age, gender);
  const tdeeResult = calculateTdee(bmrResult.bmr, activityLevel);
  const nutritionResult = calculateNutritionTargets(
    tdeeResult.tdee,
    weightKg,
    primaryGoal,
    gender,
    age,
    healthConditions,
    isPregnant
  );

  const hasHealthWarning =
    nutritionResult.safetyWarnings.length > 0 || bmiResult.isMinor || (bmiResult.bmi < 18.5 && primaryGoal === "weight_loss");

  return {
    bmi: bmiResult,
    bmr: bmrResult,
    tdee: tdeeResult,
    nutrition: nutritionResult,
    inputs: {
      weightKg,
      heightCm,
      age,
      gender: gender || "prefer_not_to_say",
      activityLevel,
      fitnessExperience,
      primaryGoal,
    },
    summary: {
      bmi: bmiResult.bmi,
      bmiCategory: bmiResult.category,
      bmr: bmrResult.bmr,
      tdee: tdeeResult.tdee,
      dailyCalories: nutritionResult.dailyCalories,
      proteinGrams: nutritionResult.protein.grams,
      carbsGrams: nutritionResult.carbs.grams,
      fatGrams: nutritionResult.fat.grams,
      isMinor: bmiResult.isMinor,
      hasHealthWarning,
    },
  };
}

