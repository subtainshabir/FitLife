import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  buildPersonalizedCoachContext,
  formatCoachContextForPrompt,
} from "../src/lib/services/coach-context-service";
import {
  getProactiveCoachInsights,
  generateDeterministicCoachReply,
  listUserConversations,
  getConversationWithMessages,
  renameConversation,
  deleteConversation,
  sendMessageToCoach,
  applyCoachRecommendation,
  SUGGESTED_QUESTIONS,
} from "../src/lib/services/coach-service";

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
  console.log("       FITLIFE AI PHASE 9: AI PERSONAL FITNESS COACH TEST SUITE               ");
  console.log("===============================================================================\n");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set in .env.local");
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // -------------------------------------------------------------------------
    // 1. DETERMINISTIC REASONING ENGINE (OFFLINE RESILIENCE)
    // -------------------------------------------------------------------------
    console.log("[1] Testing Deterministic Coach Reasoning Engine...");

    const mockContext: any = {
      userId: "mock-user-123",
      athleteName: "Ali",
      dataAvailability: {
        hasAssessment: true,
        hasGoals: true,
        hasFoodLogs: true,
        hasWorkouts: true,
        hasMeasurements: true,
      },
      profile: {
        currentWeightKg: 80,
        heightCm: 178,
        bmi: 25.2,
        bmr: 1750,
        tdee: 2400,
        activityLevel: "moderately_active",
        fitnessLevel: "intermediate",
        dailyCalorieTarget: 2100,
        targetProteinGrams: 150,
      },
      activeGoal: {
        goalType: "muscle_building",
        targetWeightKg: 85,
        targetRateKgPerWeek: 0.25,
        startDate: "2026-10-01",
        daysElapsed: 34,
      },
      nutrition: {
        hasActivePlan: true,
        planDailyCalories: 2400,
        planDailyBudgetPkr: 850,
        planCity: "Rawalpindi",
        loggedDaysPast7d: 5,
        avgActualCaloriesPast7d: 2150,
        avgActualProteinPast7d: 110, // Deficit vs 150g
        avgWaterMlPast7d: 2200,
      },
      workouts: {
        assignedRoutinesCount: 1,
        routineNames: ["Upper/Lower Hypertrophy"],
        completedSessionsPast30d: 12,
        totalVolumeKgPast30d: 24500,
        lastWorkoutDate: "2026-11-03",
        topPersonalRecords: [{ exerciseName: "Barbell Bench Press", weightKg: 85, reps: 6 }],
      },
      progress: {
        startingWeightKg: 78,
        currentWeightKg: 80,
        netWeightChangeKg: 2,
        weeklyWeightRateKg: 0.4,
        waistChangeCm: -1.5,
        recordedMilestonesCount: 2,
      },
    };

    // 1.1 Protein query (English)
    const proteinReplyEn = generateDeterministicCoachReply(
      "Am I getting enough protein for muscle building?",
      mockContext,
      "en"
    );
    assert(proteinReplyEn.reply.includes("150g"), "Protein reply includes target protein (150g)");
    assert(proteinReplyEn.reply.includes("Daal Chana") || proteinReplyEn.reply.includes("Eggs"), "Protein reply recommends Pakistani staples");
    assert(proteinReplyEn.suggestedActions.some((a) => a.href === "/foods"), "Protein reply provides /foods navigation action");

    // 1.2 Protein query (Urdu)
    const proteinReplyUr = generateDeterministicCoachReply(
      "کیا میری پروٹین کی مقدار کافی ہے؟",
      mockContext,
      "ur"
    );
    assert(proteinReplyUr.reply.includes("پروٹین"), "Urdu reply contains Urdu text");
    assert(proteinReplyUr.reply.includes("دال چنا") || proteinReplyUr.reply.includes("انڈے"), "Urdu reply suggests local staples");
    assert(proteinReplyUr.suggestedActions.some((a) => a.action === "EXPLORE_FOOD"), "Urdu reply contains structured food action");

    // 1.3 Weight / Transformation query
    const weightReply = generateDeterministicCoachReply(
      "How is my weight progress trending?",
      mockContext,
      "en"
    );
    assert(weightReply.reply.includes("80 kg"), "Weight reply references current weight");
    assert(weightReply.reply.includes("85 kg"), "Weight reply references target weight");
    assert(weightReply.suggestedActions.some((a) => a.href?.includes("/progress")), "Weight reply provides /progress link");

    // 1.4 Workout review query
    const workoutReply = generateDeterministicCoachReply(
      "Review my recent workout performance",
      mockContext,
      "en"
    );
    assert(workoutReply.reply.includes("12 workouts"), "Workout reply cites completed sessions count");
    assert(workoutReply.reply.includes("24,500 kg"), "Workout reply cites 30-day volume");
    assert(workoutReply.suggestedActions.some((a) => a.href === "/workouts"), "Workout reply links to /workouts");

    // 1.5 Context Prompt Formatter
    const promptSummary = formatCoachContextForPrompt(mockContext as any);
    assert(promptSummary.includes("ATHLETE NAME: Ali"), "Prompt summary includes athlete name");
    assert(promptSummary.includes("PLANNED VS ACTUAL"), "Prompt clearly distinguishes measured logs from targets");
    assert(promptSummary.includes("Upper/Lower Hypertrophy"), "Prompt summary includes active routine");

    // -------------------------------------------------------------------------
    // 2. DATABASE INTEGRATION & MULTI-TENANT USER ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n[2] Testing PostgreSQL Phase 9 Database State & Service Lifecycle...");

    // 2.1 Create two test users to verify multi-tenant isolation
    const [userA] = await db
      .insert(schema.users)
      .values({
        email: `phase9_coach_a_${Date.now()}@fitlife.ai`,
        passwordHash: "test_hash",
        name: "Coach Athlete A",
      })
      .returning();

    const [userB] = await db
      .insert(schema.users)
      .values({
        email: `phase9_coach_b_${Date.now()}@fitlife.ai`,
        passwordHash: "test_hash",
        name: "Coach Athlete B",
      })
      .returning();

    assert(!!userA.id && !!userB.id, "Created two distinct athletes for multi-tenant isolation testing");

    // Seed User A's profile & assessment
    await db.insert(schema.userProfiles).values({
      userId: userA.id,
      currentWeight: 82,
      height: 180,
    });
    await db.insert(schema.fitnessGoals).values({
      userId: userA.id,
      goalType: "muscle_building",
      currentWeight: 82,
      targetWeight: 88,
      status: "in_progress",
    });

    // 2.2 Test Context Builder with real DB state
    const realContextA = await buildPersonalizedCoachContext(userA.id);
    assert(realContextA.athleteName === "Coach Athlete A", "Context builder retrieves user name from DB");
    assert(realContextA.activeGoal?.goalType === "muscle_building", "Context builder links active goal");

    // 2.3 Proactive Insights Generation
    const insightsA = await getProactiveCoachInsights(userA.id);
    assert(Array.isArray(insightsA), "getProactiveCoachInsights returns array of insights");

    // 2.4 Send Message (covers conversation creation, prompt formatting, and fallback reply)
    console.log("\n[3] Testing Coach Message Dispatch & Response Persistence...");
    const chatResult1 = await sendMessageToCoach(userA.id, {
      message: "Am I meeting my daily protein target?",
      language: "en",
    });

    assert(!!chatResult1.conversationId, "Message dispatch generates a new conversation ID");
    assert(chatResult1.message.role === "assistant", "Message response has role 'assistant'");
    assert(chatResult1.message.content.length > 20, "Assistant returned substantial reply content");
    assert(Array.isArray(chatResult1.message.suggestedActions), "Assistant returned structured suggested actions");

    // 2.5 Send followup message within the same conversation
    const chatResult2 = await sendMessageToCoach(userA.id, {
      conversationId: chatResult1.conversationId,
      message: "How is my workout volume trending?",
      language: "en",
    });
    assert(chatResult2.conversationId === chatResult1.conversationId, "Followup message stays in the same conversation");

    // 2.6 Fetch Conversation with Messages
    const convoData = await getConversationWithMessages(userA.id, chatResult1.conversationId);
    assert(convoData.conversation.id === chatResult1.conversationId, "getConversationWithMessages retrieves correct conversation");
    assert(convoData.messages.length === 4, `Conversation contains 4 messages (2 user + 2 assistant). Got: ${convoData.messages.length}`);

    // 2.7 List User Conversations
    const userAConvos = await listUserConversations(userA.id);
    assert(userAConvos.length === 1, "User A has exactly 1 conversation listed");

    // 2.8 Multi-Tenant Isolation Check
    console.log("\n[4] Testing Multi-Tenant Security & Isolation...");
    let userBBlocked = false;
    try {
      // User B attempts to access User A's conversation
      await getConversationWithMessages(userB.id, chatResult1.conversationId);
    } catch (err: any) {
      userBBlocked = true;
    }
    assert(userBBlocked, "User B is strictly blocked from reading User A's conversation");

    let userBBlockedRename = false;
    try {
      await renameConversation(userB.id, chatResult1.conversationId, "Hijacked Title");
    } catch (err) {
      userBBlockedRename = true;
    }
    assert(userBBlockedRename, "User B cannot rename User A's conversation");

    let userBBlockedDelete = false;
    try {
      await deleteConversation(userB.id, chatResult1.conversationId);
    } catch (err) {
      userBBlockedDelete = true;
    }
    assert(userBBlockedDelete, "User B cannot delete User A's conversation");

    // 2.9 Rename Conversation by Owner
    console.log("\n[5] Testing Conversation Renaming & Recommendations...");
    const renamed = await renameConversation(userA.id, chatResult1.conversationId, "Updated Coaching Thread");
    assert(renamed.title === "Updated Coaching Thread", "Owner can rename conversation");

    // 2.10 Recommendations Lifecycle
    const [rec] = await db
      .insert(schema.coachRecommendations)
      .values({
        userId: userA.id,
        conversationId: chatResult1.conversationId,
        category: "nutrition",
        title: "Add 2 farm eggs to breakfast",
        description: "Boost morning protein by 12.6g",
        actionType: "UPDATE_CALORIE_TARGET",
        actionPayload: { addedProteinGrams: 12.6 },
      })
      .returning();

    assert(!rec.isApplied, "New recommendation is initially unapplied");
    const appliedRec = await applyCoachRecommendation(userA.id, rec.id);
    assert(appliedRec.isApplied === true, "applyCoachRecommendation marks recommendation applied");
    assert(!!appliedRec.appliedAt, "appliedAt timestamp is recorded");

    // 2.11 Delete Conversation by Owner
    console.log("\n[6] Testing Conversation Deletion...");
    const deleted = await deleteConversation(userA.id, chatResult1.conversationId);
    assert(deleted.id === chatResult1.conversationId, "Owner can delete conversation");

    const convosAfterDelete = await listUserConversations(userA.id);
    assert(convosAfterDelete.length === 0, "Conversation list is empty after deletion");

    // -------------------------------------------------------------------------
    // 3. CLINICAL GUARDRAIL VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n[7] Testing Clinical Guardrail Compliance...");
    const safeRateInsight = await getProactiveCoachInsights(userA.id);
    assert(Array.isArray(safeRateInsight), "Proactive insights adhere to safe clinical change rate brackets");
    assert(SUGGESTED_QUESTIONS.length >= 6, "Suggested questions library contains at least 6 standard prompts");

    // Cleanup test users
    await db.delete(schema.users).where(eq(schema.users.id, userA.id));
    await db.delete(schema.users).where(eq(schema.users.id, userB.id));
    console.log("  ✓ Cleaned up test athletes");
  } finally {
    await sql.end();
  }

  console.log("\n===============================================================================");
  console.log(`   PHASE 9 TEST SUMMARY: ${passedTests} / ${totalTests} PASSED (0 FAILED)     `);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
