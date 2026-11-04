import {
  bodyMeasurementSchema,
  updateBodyMeasurementSchema,
  customMilestoneSchema,
  saveReportSchema,
  photoUploadSchema,
} from "../src/lib/validations/progress";

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

function runApiValidationTests() {
  console.log("===============================================================================");
  console.log("       FITLIFE AI PHASE 8: PROGRESS & MEASUREMENT API VALIDATION TESTS        ");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------------------
  // 1. BODY MEASUREMENT SCHEMA
  // -------------------------------------------------------------------------
  console.log("[1] Testing bodyMeasurementSchema...");

  // Valid metric payload
  const validMetric = bodyMeasurementSchema.safeParse({
    unitSystem: "metric",
    weight: 78.5,
    waist: 84.0,
    chest: 102.0,
    bodyFatPercentage: 16.5,
    notes: "Morning measurement",
  });
  assert(validMetric.success, "Valid metric measurement payload passes validation");

  // Valid imperial payload
  const validImperial = bodyMeasurementSchema.safeParse({
    unitSystem: "imperial",
    waist: 33.0,
    chest: 40.5,
    arm: 14.5,
  });
  assert(validImperial.success, "Valid imperial measurement payload passes validation");

  // Rejection when all fields empty
  const emptyPayload = bodyMeasurementSchema.safeParse({
    unitSystem: "metric",
  });
  assert(!emptyPayload.success, "Empty measurement payload is rejected (must provide at least one value)");

  // Rejection of impossible body fat (>70%)
  const highBodyFat = bodyMeasurementSchema.safeParse({
    bodyFatPercentage: 95,
  });
  assert(!highBodyFat.success, "Extreme body fat percentage (>70%) is rejected");

  // Rejection of negative circumferences
  const negativeWaist = bodyMeasurementSchema.safeParse({
    waist: -10,
  });
  assert(!negativeWaist.success, "Negative waist circumference is rejected");

  // -------------------------------------------------------------------------
  // 2. UPDATE BODY MEASUREMENT SCHEMA
  // -------------------------------------------------------------------------
  console.log("\n[2] Testing updateBodyMeasurementSchema...");

  const validUpdate = updateBodyMeasurementSchema.safeParse({
    waist: 82.5,
    notes: "Updated waist after fasting",
  });
  assert(validUpdate.success, "Valid update measurement payload passes");

  const nullableUpdate = updateBodyMeasurementSchema.safeParse({
    bodyFatPercentage: null,
  });
  assert(nullableUpdate.success, "Allowing null to clear a field passes");

  // -------------------------------------------------------------------------
  // 3. CUSTOM MILESTONE SCHEMA
  // -------------------------------------------------------------------------
  console.log("\n[3] Testing customMilestoneSchema...");

  const validMilestone = customMilestoneSchema.safeParse({
    category: "weight",
    titleEn: "Drop to 75kg",
    titleUr: "75 کلوگرام تک کمی",
    targetValue: 75,
    currentValue: 80,
    unit: "kg",
  });
  assert(validMilestone.success, "Valid custom milestone payload passes");

  const shortTitle = customMilestoneSchema.safeParse({
    category: "custom",
    titleEn: "A",
    titleUr: "ب",
  });
  assert(!shortTitle.success, "Short title (<2 chars) is rejected");

  // -------------------------------------------------------------------------
  // 4. SAVE REPORT SCHEMA
  // -------------------------------------------------------------------------
  console.log("\n[4] Testing saveReportSchema...");

  const validReport = saveReportSchema.safeParse({
    periodType: "30_days",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    metrics: { weightDeltaKg: -3.5, workoutsCompleted: 12 },
  });
  assert(validReport.success, "Valid save report snapshot payload passes");

  const invalidPeriod = saveReportSchema.safeParse({
    periodType: "invalid_period" as any,
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    metrics: {},
  });
  assert(!invalidPeriod.success, "Invalid period type is rejected");

  // -------------------------------------------------------------------------
  // 5. PHOTO UPLOAD SCHEMA
  // -------------------------------------------------------------------------
  console.log("\n[5] Testing photoUploadSchema...");

  const validPhotoMeta = photoUploadSchema.safeParse({
    viewAngle: "front",
    weightKg: 78.5,
    isHidden: false,
    notes: "Front pose week 4",
  });
  assert(validPhotoMeta.success, "Valid photo metadata payload passes");

  const invalidAngle = photoUploadSchema.safeParse({
    viewAngle: "overhead" as any,
  });
  assert(!invalidAngle.success, "Invalid view angle is rejected");

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`TOTAL PHASE 8 API TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runApiValidationTests();

