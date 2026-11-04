import {
  coachChatSchema,
  updateConversationSchema,
  applyRecommendationSchema,
} from "../src/lib/validations/coach";

console.log("=== Testing Phase 9 Coach Validation Schemas ===");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

// 1. coachChatSchema
console.log("\n1. coachChatSchema Tests:");
{
  const valid1 = coachChatSchema.safeParse({
    message: "What is my current protein target?",
  });
  assert(valid1.success, "Valid basic message passes");
  if (valid1.success) {
    assert(valid1.data.language === "en", "Default language defaults to 'en'");
  }

  const valid2 = coachChatSchema.safeParse({
    conversationId: "123e4567-e89b-12d3-a456-426614174000",
    message: "کیا میرا وزن کم ہو رہا ہے؟",
    language: "ur",
  });
  assert(valid2.success, "Valid message with UUID conversationId and 'ur' language passes");

  const emptyMsg = coachChatSchema.safeParse({
    message: "   ",
  });
  assert(!emptyMsg.success, "Empty/whitespace message is rejected");

  const longMsg = coachChatSchema.safeParse({
    message: "A".repeat(2001),
  });
  assert(!longMsg.success, "Message exceeding 2000 chars is rejected");

  const invalidUuid = coachChatSchema.safeParse({
    conversationId: "not-a-valid-uuid",
    message: "Hello coach",
  });
  assert(!invalidUuid.success, "Invalid conversationId UUID is rejected");

  const invalidLang = coachChatSchema.safeParse({
    message: "Hello coach",
    language: "es",
  });
  assert(!invalidLang.success, "Invalid language enum is rejected");
}

// 2. updateConversationSchema
console.log("\n2. updateConversationSchema Tests:");
{
  const valid = updateConversationSchema.safeParse({
    title: "Weekly Nutrition Checkup",
  });
  assert(valid.success, "Valid conversation title passes");

  const emptyTitle = updateConversationSchema.safeParse({
    title: "  ",
  });
  assert(!emptyTitle.success, "Empty conversation title is rejected");

  const longTitle = updateConversationSchema.safeParse({
    title: "T".repeat(101),
  });
  assert(!longTitle.success, "Conversation title exceeding 100 characters is rejected");
}

// 3. applyRecommendationSchema
console.log("\n3. applyRecommendationSchema Tests:");
{
  const valid = applyRecommendationSchema.safeParse({
    confirmed: true,
  });
  assert(valid.success, "confirmed: true passes");

  const invalidFalse = applyRecommendationSchema.safeParse({
    confirmed: false,
  });
  assert(!invalidFalse.success, "confirmed: false is rejected");

  const missingConfirmed = applyRecommendationSchema.safeParse({});
  assert(!missingConfirmed.success, "Missing confirmed field is rejected");
}

console.log(`\n=== API Validation Test Results: ${passed} Passed, ${failed} Failed ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL PHASE 9 API SCHEMA TESTS PASSED!");
}
