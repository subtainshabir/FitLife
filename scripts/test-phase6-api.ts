import {
  createRoutineSchema,
  updateRoutineSchema,
  scheduleWorkoutSchema,
  bulkScheduleSchema,
  startSessionSchema,
  logSetSchema,
  completeSessionSchema,
  substituteExerciseSchema,
} from "../src/lib/validations/workout";

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
console.log("       FITLIFE AI PHASE 6: WORKOUT API & VALIDATION TEST SUITE                 ");
console.log("===============================================================================\n");

// 1. Create Routine Schema
console.log("[1] Testing createRoutineSchema...");
const validRoutine = {
  name: "Upper Body Hypertrophy",
  nameUr: "اوپری جسم کی ورزش",
  description: "Targeted chest and back development",
  difficulty: "intermediate",
  targetDurationMinutes: 50,
  splitType: "upper_lower",
  tags: ["strength", "upper"],
  isTemplate: false,
  exercises: [
    {
      exerciseId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
      orderIndex: 0,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: 40,
      restSeconds: 90,
      notes: "Strict form",
    },
  ],
};
const routineRes1 = createRoutineSchema.safeParse(validRoutine);
assert(routineRes1.success === true, "Valid routine payload passes validation");

const emptyRoutine = { ...validRoutine, exercises: [] };
const routineRes2 = createRoutineSchema.safeParse(emptyRoutine);
assert(routineRes2.success === false, "Routine without exercises is rejected");

const shortNameRoutine = { ...validRoutine, name: "A" };
const routineRes3 = createRoutineSchema.safeParse(shortNameRoutine);
assert(routineRes3.success === false, "Routine with name < 2 chars is rejected");

// 2. Schedule Workout Schema
console.log("\n[2] Testing scheduleWorkoutSchema & bulkScheduleSchema...");
const validDay = {
  dayOfWeek: 1, // Monday
  routineId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  isRestDay: false,
  scheduledTime: "07:30",
  notes: "Morning session",
};
const dayRes1 = scheduleWorkoutSchema.safeParse(validDay);
assert(dayRes1.success === true, "Valid schedule day passes validation");

const invalidTimeDay = { ...validDay, scheduledTime: "25:99" };
const dayRes2 = scheduleWorkoutSchema.safeParse(invalidTimeDay);
assert(dayRes2.success === false, "Invalid HH:MM format (25:99) is rejected");

const invalidDayOfWeek = { ...validDay, dayOfWeek: 8 };
const dayRes3 = scheduleWorkoutSchema.safeParse(invalidDayOfWeek);
assert(dayRes3.success === false, "dayOfWeek > 6 is rejected");

const validBulk = {
  schedules: [
    { dayOfWeek: 0, isRestDay: true, scheduledTime: "08:00" },
    { dayOfWeek: 1, isRestDay: false, routineId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41", scheduledTime: "07:00" },
  ],
};
const bulkRes = bulkScheduleSchema.safeParse(validBulk);
assert(bulkRes.success === true, "Valid bulk schedule passes validation");

// 3. Start Session Schema
console.log("\n[3] Testing startSessionSchema...");
const startRes1 = startSessionSchema.safeParse({
  routineId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  name: "Friday Push Day",
});
assert(startRes1.success === true, "Valid start session passes validation");

const startRes2 = startSessionSchema.safeParse({ name: "" });
assert(startRes2.success === false, "Start session with empty name is rejected");

// 4. Log Set Schema
console.log("\n[4] Testing logSetSchema...");
const validSet = {
  sessionExerciseId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  setNumber: 1,
  isWarmup: false,
  weightKg: 60,
  repsCompleted: 10,
  isCompleted: true,
  rpe: 8.5,
};
const setRes1 = logSetSchema.safeParse(validSet);
assert(setRes1.success === true, "Valid set log passes validation");

const invalidRpeSet = { ...validSet, rpe: 12 };
const setRes2 = logSetSchema.safeParse(invalidRpeSet);
assert(setRes2.success === false, "RPE > 10 is rejected");

const negativeWeightSet = { ...validSet, weightKg: -5 };
const setRes3 = logSetSchema.safeParse(negativeWeightSet);
assert(setRes3.success === false, "Negative weight is rejected");

// 5. Complete Session Schema
console.log("\n[5] Testing completeSessionSchema...");
const validComplete = {
  durationSeconds: 2700,
  rating: 5,
  perceivedExertionRpe: 8.5,
  notes: "Felt strong throughout",
};
const compRes1 = completeSessionSchema.safeParse(validComplete);
assert(compRes1.success === true, "Valid complete session payload passes");

const invalidRatingComplete = { ...validComplete, rating: 6 };
const compRes2 = completeSessionSchema.safeParse(invalidRatingComplete);
assert(compRes2.success === false, "Star rating > 5 is rejected");

// 6. Substitute Exercise Schema
console.log("\n[6] Testing substituteExerciseSchema...");
const validSub = {
  sessionExerciseId: "b8450f3d-d9b8-4e32-9f1e-450be893bc41",
  replacementExerciseId: "a1450f3d-d9b8-4e32-9f1e-450be893bc42",
  notes: "Replaced bench with incline dumbell",
};
const subRes = substituteExerciseSchema.safeParse(validSub);
assert(subRes.success === true, "Valid exercise substitution passes");

console.log("\n===============================================================================");
console.log(`TOTAL API TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
console.log("===============================================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}

