import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  cmToIn,
  inToCm,
  kgToLbs,
  lbsToKg,
  getWeightHistory,
  logWeightEntry,
  updateWeightEntry,
  deleteWeightEntry,
  logBodyMeasurement,
  getBodyMeasurements,
  updateBodyMeasurement,
  deleteBodyMeasurement,
  getTransformationOverview,
  getProgressAnalytics,
  saveTransformationPhoto,
  getTransformationPhotos,
  getPhotoFile,
  deleteTransformationPhoto,
  evaluateAndSyncMilestones,
  getMilestones,
  createCustomMilestone,
  generateProgressReport,
  exportProgressDataCsv,
} from "../src/lib/services/progress-service";

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

async function runTests() {
  console.log("===============================================================================");
  console.log("       FITLIFE AI PHASE 8: BODY TRANSFORMATION & PROGRESS TEST SUITE          ");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------------------
  // 1. UNIT CONVERSIONS & MATH CALCULATIONS
  // -------------------------------------------------------------------------
  console.log("[1] Testing Biometric Unit Conversions...");

  assert(cmToIn(100) === 39.4, "cmToIn (100 cm -> 39.4 in)", `Got: ${cmToIn(100)}`);
  assert(inToCm(32) === 81.3, "inToCm (32 in -> 81.3 cm)", `Got: ${inToCm(32)}`);
  assert(kgToLbs(70) === 154.3, "kgToLbs (70 kg -> 154.3 lbs)", `Got: ${kgToLbs(70)}`);
  assert(lbsToKg(154.3) === 70, "lbsToKg (154.3 lbs -> 70 kg)", `Got: ${lbsToKg(154.3)}`);

  // -------------------------------------------------------------------------
  // 2. DATABASE INTEGRATION & SERVICE LIFECYCLE
  // -------------------------------------------------------------------------
  console.log("\n[2] Testing PostgreSQL Phase 8 Database State & Analytics Lifecycle...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // 2.1 Create clean test user
    const [testUser] = await db
      .insert(schema.users)
      .values({
        email: `phase8_test_${Date.now()}@fitlife.ai`,
        passwordHash: "test_hash",
        name: "Phase 8 Progress Athlete",
      })
      .returning();

    assert(!!testUser.id, `Created test athlete for transformation tracking (${testUser.id})`);

    // Create user profile
    await db.insert(schema.userProfiles).values({
      userId: testUser.id,
      currentWeight: 85.0,
      height: 178,
    });

    // Create active weight loss goal (start 85kg -> target 75kg)
    await db.insert(schema.fitnessGoals).values({
      userId: testUser.id,
      goalType: "weight_loss",
      currentWeight: 85.0,
      targetWeight: 75.0,
      targetRate: 0.5,
      status: "in_progress",
    });

    // 2.2 Log Baseline Weight
    const w1 = await logWeightEntry(testUser.id, {
      weight: 85.0,
      unit: "kg",
      notes: "Day 1 baseline weight",
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });
    assert(!!w1.id, "Logged baseline weight (85 kg)");

    // 2.3 Log Subsequent Weight (82 kg, 15 days later)
    await logWeightEntry(testUser.id, {
      weight: 82.0,
      unit: "kg",
      notes: "Week 2 progress checkpoint",
      recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    // 2.4 Log Current Weight (80 kg, today)
    await logWeightEntry(testUser.id, {
      weight: 80.0,
      unit: "kg",
      notes: "Month 1 checkpoint",
      recordedAt: new Date(),
    });

    // 2.5 Query Weight History & Progress Analytics
    const weightHistory = await getWeightHistory(testUser.id);
    assert(weightHistory.totalEntries === 3, `Retrieved 3 weight history points (found ${weightHistory.totalEntries})`);
    assert(weightHistory.startingWeightKg === 85, "Starting weight correctly resolved as 85 kg");
    assert(weightHistory.currentWeightKg === 80, "Current weight correctly resolved as 80 kg");
    assert(weightHistory.targetWeightKg === 75, "Target weight resolved as 75 kg");
    assert(weightHistory.netChangeKg === -5, `Net weight change is -5 kg (Got: ${weightHistory.netChangeKg})`);
    assert(weightHistory.goalProgressPercentage === 50, `Goal progress is 50% (5kg of 10kg lost) (Got: ${weightHistory.goalProgressPercentage}%)`);
    assert(weightHistory.weeklyAverageChangeKg < 0, "Weekly rate correctly negative for weight loss");

    // 2.6 Edit Weight Entry
    const updatedWeight = await updateWeightEntry(testUser.id, w1.id, {
      notes: "Updated baseline notes",
    });
    assert(updatedWeight.notes === "Updated baseline notes", "Updated weight entry notes successfully");

    // 2.7 Log Body Measurements (Circumferences)
    const m1 = await logBodyMeasurement(testUser.id, {
      waist: 92,
      chest: 104,
      arm: 36,
      hip: 102,
      bodyFatPercentage: 22,
      weight: 85,
      notes: "Month 0 baseline tape measurement",
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });
    assert(!!m1.id, "Logged Month 0 body circumferences");

    // Month 1 circumferences
    const m2 = await logBodyMeasurement(testUser.id, {
      waist: 88, // 4 cm waist reduction!
      chest: 103,
      arm: 36.5,
      hip: 99,
      bodyFatPercentage: 19.5,
      weight: 80,
      notes: "Month 1 tape measurement",
      recordedAt: new Date(),
    });
    assert(!!m2.id, "Logged Month 1 body circumferences");

    // 2.8 Verify Measurement Deltas
    const measurements = await getBodyMeasurements(testUser.id);
    assert(measurements.totalRecords === 2, "Retrieved 2 body measurement records");
    assert(measurements.deltas.waistCm.cm === -4, `Waist delta is -4 cm (Got: ${measurements.deltas.waistCm.cm} cm)`);
    assert(measurements.deltas.bodyFatPercentage.cm === -2.5, "Body fat delta is -2.5%");

    // 2.9 Transformation Overview Dashboard Aggregation
    const overview = await getTransformationOverview(testUser.id);
    assert(overview.weight.currentKg === 80, "Overview contains current weight (80 kg)");
    assert(overview.weight.progressPercentage === 50, "Overview contains 50% goal progress");
    assert(overview.measurements.deltas.waistCm.cm === -4, "Overview includes waist delta (-4 cm)");

    // 2.10 Recharts Analytics Series Generation
    const analytics = await getProgressAnalytics(testUser.id, "30d");
    assert(analytics.weightSeries.length >= 3, `Generated ${analytics.weightSeries.length} points for Recharts weight chart`);
    assert(analytics.weightSeries[0].movingAvgKg > 0, "Calculated moving average for weight smoothing");
    assert(analytics.measurementSeries.length >= 2, "Generated measurement series for circumference chart");

    // 2.11 Transformation Photo Journal & Privacy
    const testBuffer = Buffer.from("FAKE_JPEG_IMAGE_DATA_FITLIFE_PHASE8");
    const photo = await saveTransformationPhoto(
      testUser.id,
      {
        buffer: testBuffer,
        fileName: "test_front.jpg",
        mimeType: "image/jpeg",
        size: testBuffer.length,
      },
      {
        viewAngle: "front",
        weightKg: 80,
        notes: "Test transformation photo",
      }
    );

    assert(!!photo.id, "Securely saved transformation photo metadata & file on disk");
    assert(photo.fileUrl.startsWith("/api/v1/progress/photos/"), "Generated authorized streaming URL");

    // Stream photo file check
    const fetchedFile = await getPhotoFile(testUser.id, photo.id);
    assert(fetchedFile.mimeType === "image/jpeg", "Authenticated photo file streaming matches image/jpeg");
    assert(fetchedFile.buffer.toString() === testBuffer.toString(), "Streamed photo buffer matches uploaded binary");

    // List user photos
    const userPhotos = await getTransformationPhotos(testUser.id);
    assert(userPhotos.length === 1, "Listed user transformation photos");

    // Delete photo
    await deleteTransformationPhoto(testUser.id, photo.id);
    const userPhotosAfter = await getTransformationPhotos(testUser.id);
    assert(userPhotosAfter.length === 0, "Photo deleted successfully from disk and database");

    // 2.12 Milestones Auto-Evaluation
    await evaluateAndSyncMilestones(testUser.id);
    const userMilestones = await getMilestones(testUser.id);
    assert(userMilestones.length >= 5, `Synchronized standard milestones (found ${userMilestones.length})`);
    const fiveKgLoss = userMilestones.find((m) => m.milestoneKey === "first_5kg_loss");
    assert(!!fiveKgLoss && fiveKgLoss.isAchieved === true, "first_5kg_loss milestone automatically marked achieved!");

    // Custom milestone creation
    const customM = await createCustomMilestone(testUser.id, {
      category: "measurement",
      titleEn: "Sub-90cm Waist Club",
      titleUr: "90 سینٹی میٹر سے کم کمر",
      targetValue: 90,
      currentValue: 88,
      unit: "cm",
    });
    assert(!!customM.id, "Created user custom milestone");
    assert(customM.isAchieved === true, "Custom milestone evaluated as achieved (88 <= 90)");

    // 2.13 Visual Progress Report & CSV Export
    const report = await generateProgressReport(testUser.id, "30_days");
    assert(report.weight.weightChangeKg === -5, "Progress report calculates -5 kg weight change");
    assert(report.measurements.waistChangeCm === -4, "Progress report calculates -4 cm waist reduction");
    assert(report.achievedMilestones.length >= 1, "Progress report lists achieved milestones");

    const csvData = await exportProgressDataCsv(testUser.id);
    assert(csvData.includes("--- WEIGHT HISTORY ---"), "CSV export includes Weight History section");
    assert(csvData.includes("--- BODY MEASUREMENTS (cm) ---"), "CSV export includes Body Measurements section");
    assert(csvData.includes("85"), "CSV export includes baseline weight record");

    // 2.14 Clean up test user
    await db.delete(schema.users).where(eq(schema.users.id, testUser.id));
    console.log("  ✓ Cleaned up test user and associated progress records");
  } finally {
    await sql.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`TOTAL PHASE 8 TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
