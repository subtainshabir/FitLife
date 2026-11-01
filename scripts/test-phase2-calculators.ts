import {
  calculateBmi,
  calculateBmr,
  calculateTdee,
  calculateNutritionTargets,
  calculateGoalTimeline,
  calculateFullAssessment,
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm,
} from "../src/lib/services/fitness-calculator";

console.log("=== FITLIFE AI: PHASE 2 CALCULATOR & SERVICE TESTS ===\n");

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
// 1. Unit Conversions
// ---------------------------------------------------------------------------
console.log("[1] Unit Conversions...");
// 70 kg -> 154.3 lbs
const lbs = kgToLbs(70);
assert(Math.abs(lbs - 154.3) < 0.2, "kgToLbs (70 kg -> ~154.3 lbs)", `Got ${lbs}`);

// 154.3 lbs -> 70 kg
const kg = lbsToKg(154.3);
assert(Math.abs(kg - 70.0) < 0.2, "lbsToKg (154.3 lbs -> ~70 kg)", `Got ${kg}`);

// 178 cm -> 5 ft 10 in
const ftIn = cmToFtIn(178);
assert(ftIn.feet === 5 && ftIn.inches === 10, "cmToFtIn (178 cm -> 5 ft 10 in)", `Got ${JSON.stringify(ftIn)}`);

// 5 ft 10 in -> 177.8 cm
const cm = ftInToCm(5, 10);
assert(Math.abs(cm - 177.8) < 0.2, "ftInToCm (5 ft 10 in -> 177.8 cm)", `Got ${cm}`);

// ---------------------------------------------------------------------------
// 2. BMI Calculation
// ---------------------------------------------------------------------------
console.log("\n[2] BMI Calculation & Categories...");
// Height: 175 cm (1.75 m), Weight: 70 kg -> BMI = 70 / (1.75 * 1.75) = 22.86 -> 22.9 (Normal)
const bmiNormal = calculateBmi(70, 175, 25);
assert(bmiNormal.bmi === 22.9, "Adult normal BMI value 22.9", `Got ${bmiNormal.bmi}`);
assert(bmiNormal.category === "normal", "Adult BMI category 'normal'", `Got ${bmiNormal.category}`);

// Underweight test: 45 kg, 175 cm -> BMI = 14.7
const bmiUnder = calculateBmi(45, 175, 25);
assert(bmiUnder.category === "underweight", "Adult BMI category 'underweight'", `Got ${bmiUnder.category}`);

// Overweight test: 85 kg, 175 cm -> BMI = 27.8
const bmiOver = calculateBmi(85, 175, 25);
assert(bmiOver.category === "overweight", "Adult BMI category 'overweight'", `Got ${bmiOver.category}`);

// Obese Class I: 95 kg, 175 cm -> BMI = 31.0
const bmiObese1 = calculateBmi(95, 175, 25);
assert(bmiObese1.category === "obese_1", "Adult BMI category 'obese_1'", `Got ${bmiObese1.category}`);

// Minor Safeguard: Age 16 (under 18) must NOT receive adult categories
const bmiMinor = calculateBmi(70, 175, 16);
assert(bmiMinor.isMinor === true, "Minor flagged with isMinor = true");
assert(
  bmiMinor.category === "pediatric_minor",
  "Minor assigned 'pediatric_minor' rather than adult category",
  `Got ${bmiMinor.category}`
);

// ---------------------------------------------------------------------------
// 3. BMR (Mifflin-St Jeor)
// ---------------------------------------------------------------------------
console.log("\n[3] BMR (Mifflin-St Jeor Equation)...");
// Male: 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674 kcal
const bmrMale = calculateBmr(70, 175, 25, "male");
assert(bmrMale.bmr === 1674, "Mifflin-St Jeor Male calculation matches 1674 kcal", `Got ${bmrMale.bmr}`);

// Female: 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330 kcal
const bmrFemale = calculateBmr(60, 165, 28, "female");
assert(bmrFemale.bmr === 1330, "Mifflin-St Jeor Female calculation matches 1330 kcal", `Got ${bmrFemale.bmr}`);

// Prefer not to say / Gender-Neutral Midpoint
const bmrNeutral = calculateBmr(70, 175, 25, "prefer_not_to_say");
assert(bmrNeutral.inputsUsed.assumedSex === true, "Midpoint flag set when gender omitted");
assert(bmrNeutral.bmr === 1591, "Gender-neutral midpoint BMR is 1591", `Got ${bmrNeutral.bmr}`);

// ---------------------------------------------------------------------------
// 4. TDEE Multipliers
// ---------------------------------------------------------------------------
console.log("\n[4] TDEE Calculation...");
// BMR: 1674
// Sedentary (1.2) -> 2009 kcal
const tdeeSedentary = calculateTdee(1674, "sedentary");
assert(tdeeSedentary.tdee === 2009, "Sedentary TDEE multiplier 1.2 -> 2009 kcal", `Got ${tdeeSedentary.tdee}`);

// Moderately Active (1.55) -> 2595 kcal
const tdeeModerate = calculateTdee(1674, "moderately_active");
assert(tdeeModerate.tdee === 2595, "Moderately Active TDEE multiplier 1.55 -> 2595 kcal", `Got ${tdeeModerate.tdee}`);

// Extra Active (1.9) -> 3181 kcal
const tdeeExtra = calculateTdee(1674, "extra_active");
assert(tdeeExtra.tdee === 3181, "Extra Active TDEE multiplier 1.9 -> 3181 kcal", `Got ${tdeeExtra.tdee}`);

// ---------------------------------------------------------------------------
// 5. Nutrition Targets & Macronutrients
// ---------------------------------------------------------------------------
console.log("\n[5] Nutrition Targets & Safety Safeguards...");
// Muscle Building: Surplus + High Protein
const muscleTargets = calculateNutritionTargets(2595, 70, "muscle_building", "male", 25);
assert(muscleTargets.dailyCalories === 2895, "Muscle building surplus +300 kcal (2895)", `Got ${muscleTargets.dailyCalories}`);
assert(muscleTargets.protein.grams === 140, "Protein for 70kg muscle building = 140g (2.0 g/kg)", `Got ${muscleTargets.protein.grams}`);
assert(muscleTargets.protein.percentage > 0, "Protein percentage calculated");
assert(muscleTargets.fat.grams > 0, "Fat grams calculated");
assert(muscleTargets.carbs.grams > 0, "Carbohydrate grams calculated");

// Weight Loss: Deficit
const lossTargets = calculateNutritionTargets(2595, 70, "weight_loss", "male", 25);
assert(lossTargets.dailyCalories === 2145, "Weight loss deficit -450 kcal (2145)", `Got ${lossTargets.dailyCalories}`);

// Absolute Caloric Floor Protection: 1000 kcal initial -> clamped to 1500 for male
const floorMale = calculateNutritionTargets(1200, 60, "weight_loss", "male", 25);
assert(floorMale.dailyCalories === 1500, "Male caloric floor strictly clamped to 1500 kcal", `Got ${floorMale.dailyCalories}`);
assert(floorMale.isRestrictedMinFloor === true, "Floor protection flag set to true");

// Minor Safeguard: Minor with weight loss goal has deficit neutralized
const minorNutrition = calculateNutritionTargets(2200, 65, "weight_loss", "male", 15);
assert(minorNutrition.safetyWarnings.length > 0, "Minor safety warning generated");
assert(minorNutrition.dailyCalories === 2200, "Minor deficit neutralized to maintenance (2200)", `Got ${minorNutrition.dailyCalories}`);

// Pregnancy Safeguard: Pregnancy with deficit goal overridden
const pregnantNutrition = calculateNutritionTargets(2000, 60, "weight_loss", "female", 28, [], true);
assert(pregnantNutrition.safetyWarnings.length > 0, "Pregnancy safeguard warning generated");
assert(pregnantNutrition.dailyCalories >= 2300, "Pregnancy surplus applied instead of deficit", `Got ${pregnantNutrition.dailyCalories}`);

// ---------------------------------------------------------------------------
// 6. Goal Timeline & Safe Rates
// ---------------------------------------------------------------------------
console.log("\n[6] Goal Timeline & Safe Rate Validation...");
// Lose 5 kg at 0.5 kg/week -> 10 weeks
const timeline = calculateGoalTimeline(80, 75, 0.5, new Date("2026-01-01"));
assert(timeline.estimatedWeeks === 10, "5 kg at 0.5 kg/week = 10 weeks", `Got ${timeline.estimatedWeeks}`);
assert(timeline.isSafeRate === true, "0.5 kg/week is safe rate");

// Unsafe Rate Warning: 1.5 kg/week weight loss (>1.0 kg/week)
const unsafeTimeline = calculateGoalTimeline(80, 75, 1.5, new Date("2026-01-01"));
assert(unsafeTimeline.isSafeRate === false, "1.5 kg/week correctly flagged as unsafe rate");
assert(unsafeTimeline.warnings.length > 0, "Unsafe rate warning generated");

// Dangerously Low Target Weight (BMI < 18.5)
// Height 175 cm, Target weight 45 kg -> BMI = 14.7
const dangerousTarget = calculateGoalTimeline(65, 45, 0.5, new Date("2026-01-01"), 175);
assert(dangerousTarget.isSafeRate === false, "Target weight yielding BMI < 18.5 flagged unsafe");
assert(
  dangerousTarget.warnings.some((w) => w.includes("Critical Health Warning")),
  "Critical health warning for underweight target present"
);

// ---------------------------------------------------------------------------
// 7. Full Assessment Integration
// ---------------------------------------------------------------------------
console.log("\n[7] Full Assessment Integration Suite...");
const full = calculateFullAssessment({
  weightKg: 75,
  heightCm: 180,
  age: 26,
  gender: "male",
  activityLevel: "moderately_active",
  fitnessExperience: "intermediate",
  primaryGoal: "muscle_building",
});
assert(full.summary.bmi === 23.1, "Full assessment BMI = 23.1", `Got ${full.summary.bmi}`);
assert(full.summary.bmiCategory === "normal", "Full assessment BMI category normal");
assert(full.summary.dailyCalories > 0, "Full assessment daily calories generated");
assert(full.summary.proteinGrams > 0, "Full assessment protein generated");

console.log(`\n========================================`);
console.log(`ALL ${passed}/${total} CALCULATOR & SERVICE TESTS PASSED! ✓`);
console.log(`========================================\n`);

