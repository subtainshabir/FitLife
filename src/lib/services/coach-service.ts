import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  buildPersonalizedCoachContext,
  formatCoachContextForPrompt,
  type CoachUserContext,
} from "./coach-context-service";
import { z } from "zod";

export const SUGGESTED_QUESTIONS = [
  {
    en: "Am I meeting my daily protein target?",
    ur: "کیا میں اپنا روزانہ پروٹین کا ہدف پورا کر رہا ہوں؟",
    category: "nutrition",
  },
  {
    en: "How is my weight progress trending?",
    ur: "میرے وزن میں تبدیلی کی رفتار کیسی ہے؟",
    category: "progress",
  },
  {
    en: "Review my recent workout performance",
    ur: "میری حالیہ ورزشوں کی کارکردگی کا جائزہ لیں",
    category: "workout",
  },
  {
    en: "Suggest an affordable high-protein Pakistani meal",
    ur: "آج کے لیے مناسب خرچ میں پروٹین سے بھرپور کھانا تجویز کریں",
    category: "nutrition",
  },
  {
    en: "Why is my weight plateauing?",
    ur: "میرا وزن کیوں رک گیا ہے اور آگے نہیں بڑھ رہا؟",
    category: "progress",
  },
  {
    en: "Should I adjust my current fitness goal?",
    ur: "کیا مجھے اپنے فٹنس ہدف میں تبدیلی کرنی چاہیے؟",
    category: "goals",
  },
];

export interface CoachInsight {
  id: string;
  category: "nutrition" | "workout" | "progress" | "habits";
  type: "positive" | "warning" | "info";
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  actionHref?: string;
  actionLabelEn?: string;
  actionLabelUr?: string;
}

export interface SuggestedAction {
  action: string;
  label: string;
  href?: string;
  payload?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// 1. PROACTIVE DETERMINISTIC FITNESS INSIGHTS
// -----------------------------------------------------------------------------

export async function getProactiveCoachInsights(userId: string): Promise<CoachInsight[]> {
  const ctx = await buildPersonalizedCoachContext(userId);
  const insights: CoachInsight[] = [];

  // 1. Protein Gap Insight
  if (ctx.nutrition.loggedDaysPast7d >= 2 && ctx.profile?.targetProteinGrams && ctx.nutrition.avgActualProteinPast7d) {
    const proteinRatio = ctx.nutrition.avgActualProteinPast7d / ctx.profile.targetProteinGrams;
    if (proteinRatio < 0.8) {
      insights.push({
        id: "protein_gap",
        category: "nutrition",
        type: "warning",
        titleEn: "Protein Intake Below Target",
        titleUr: "پروٹین کا حصول ہدف سے کم ہے",
        descriptionEn: `Your 7-day average protein is ${ctx.nutrition.avgActualProteinPast7d}g vs your ${ctx.profile.targetProteinGrams}g target. Consider adding budget-friendly staples like Daal Chana, Farm Eggs, or Chicken Breast.`,
        descriptionUr: `گزشتہ 7 دنوں میں آپ کی اوسط پروٹین ${ctx.nutrition.avgActualProteinPast7d} گرام رہی جبکہ ہدف ${ctx.profile.targetProteinGrams} گرام ہے۔ دال چنا، انڈے یا چکن بریسٹ شامل کریں۔`,
        actionHref: "/foods",
        actionLabelEn: "Explore Protein Foods",
        actionLabelUr: "پروٹین والی غذائیں دیکھیں",
      });
    } else if (proteinRatio >= 0.95) {
      insights.push({
        id: "protein_hit",
        category: "nutrition",
        type: "positive",
        titleEn: "Excellent Protein Consistency",
        titleUr: "پروٹین کا شاندار تسلسل",
        descriptionEn: `You are consistently hitting your protein target (~${ctx.nutrition.avgActualProteinPast7d}g/day). This strongly supports muscle repair and recovery.`,
        descriptionUr: `آپ مسلسل پروٹین کا ہدف (~${ctx.nutrition.avgActualProteinPast7d} گرام/دن) پورا کر رہے ہیں۔ یہ عضلات کی بحالی کے لیے بہترین ہے۔`,
        actionHref: "/diary",
        actionLabelEn: "View Food Diary",
        actionLabelUr: "ڈائری دیکھیں",
      });
    }
  }

  // 2. Workout Consistency Insight
  if (ctx.workouts.completedSessionsPast30d >= 8) {
    insights.push({
      id: "workout_streak",
      category: "workout",
      type: "positive",
      titleEn: "Strong Training Consistency",
      titleUr: "مستقل اور باقاعدہ ورزش",
      descriptionEn: `You completed ${ctx.workouts.completedSessionsPast30d} workouts over the last 30 days, accumulating ${ctx.workouts.totalVolumeKgPast30d.toLocaleString()} kg of training volume.`,
      descriptionUr: `آپ نے پچھلے 30 دنوں میں ${ctx.workouts.completedSessionsPast30d} ورزشیں مکمل کیں اور کل ${ctx.workouts.totalVolumeKgPast30d.toLocaleString()} کلوگرام والیوم اٹھایا۔`,
      actionHref: "/workouts",
      actionLabelEn: "View Workouts Hub",
      actionLabelUr: "ورزشیں دیکھیں",
    });
  } else if (ctx.workouts.completedSessionsPast30d === 0) {
    insights.push({
      id: "no_workouts",
      category: "workout",
      type: "info",
      titleEn: "Start Your Training Routine",
      titleUr: "اپنی باقاعدہ ورزش شروع کریں",
      descriptionEn: "No completed workout sessions recorded in the past 30 days. Starting with 2-3 full body sessions weekly can build lasting momentum.",
      descriptionUr: "گزشتہ 30 دنوں میں کوئی ورزش ریکارڈ نہیں ہوئی۔ ہفتے میں 2 سے 3 بنیادی سیشنز سے آغاز کریں۔",
      actionHref: "/workouts",
      actionLabelEn: "Choose a Routine",
      actionLabelUr: "روٹین منتخب کریں",
    });
  }

  // 3. Weight Trend & Goal Safety Insight
  if (ctx.progress.weeklyWeightRateKg !== null && ctx.activeGoal) {
    const rate = Math.abs(ctx.progress.weeklyWeightRateKg);
    if (rate > 1.2) {
      insights.push({
        id: "rapid_weight_change",
        category: "progress",
        type: "warning",
        titleEn: "Rapid Weight Change Detected",
        titleUr: "وزن میں غیر معمولی تیز تبدیلی",
        descriptionEn: `Your weight is changing at an average rate of ${rate} kg/week. Clinical guidelines recommend 0.25 - 1.0 kg/week for sustainable, healthy changes.`,
        descriptionUr: `آپ کا وزن اوسطاً ${rate} کلوگرام فی ہفتہ بدل رہا ہے۔ پائیدار اور محفوظ فٹنس کے لیے 0.25 تا 1 کلوگرام فی ہفتہ تجویز کیا جاتا ہے۔`,
        actionHref: "/progress",
        actionLabelEn: "View Weight History",
        actionLabelUr: "وزن کی تاریخ دیکھیں",
      });
    } else if (rate >= 0.25 && rate <= 1.0) {
      insights.push({
        id: "healthy_weight_pace",
        category: "progress",
        type: "positive",
        titleEn: "Healthy & Safe Progress Pace",
        titleUr: "محفوظ اور مناسب پیش رفت",
        descriptionEn: `You are progressing at a clinically safe rate of ~${rate} kg/week toward your goal. Keep your nutrition and training balanced.`,
        descriptionUr: `آپ اپنے ہدف کی جانب ~${rate} کلوگرام فی ہفتہ کی محفوظ اور مستند رفتار سے آگے بڑھ رہے ہیں۔`,
        actionHref: "/progress",
        actionLabelEn: "View Transformation Hub",
        actionLabelUr: "پیش رفت دیکھیں",
      });
    }
  }

  // 4. Hydration Insight
  if (ctx.nutrition.avgWaterMlPast7d !== null) {
    if (ctx.nutrition.avgWaterMlPast7d < 1800) {
      insights.push({
        id: "low_hydration",
        category: "habits",
        type: "warning",
        titleEn: "Hydration Below Recommended Levels",
        titleUr: "پانی کا استعمال کم ہے",
        descriptionEn: `Your logged daily water intake is ~${ctx.nutrition.avgWaterMlPast7d} ml. Strive for at least 2500 ml daily to optimize metabolic rate and workout endurance.`,
        descriptionUr: `آپ کا یومیہ پانی کا اوسط ~${ctx.nutrition.avgWaterMlPast7d} ملی لیٹر ہے۔ ورزش میں توانائی کے لیے روزانہ کم از کم 2500 ملی لیٹر پانی پئیں۔`,
        actionHref: "/diary",
        actionLabelEn: "Log Water Intake",
        actionLabelUr: "پانی لاگ کریں",
      });
    }
  }

  return insights;
}

// -----------------------------------------------------------------------------
// 2. CONVERSATIONS CRUD
// -----------------------------------------------------------------------------

export async function listUserConversations(userId: string) {
  const convos = await db
    .select({
      id: schema.coachConversations.id,
      title: schema.coachConversations.title,
      createdAt: schema.coachConversations.createdAt,
      updatedAt: schema.coachConversations.updatedAt,
    })
    .from(schema.coachConversations)
    .where(eq(schema.coachConversations.userId, userId))
    .orderBy(desc(schema.coachConversations.updatedAt));

  return convos;
}

export async function getConversationWithMessages(userId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(schema.coachConversations)
    .where(and(eq(schema.coachConversations.id, conversationId), eq(schema.coachConversations.userId, userId)))
    .limit(1);

  if (!conversation) {
    throw new Error("Conversation not found or access denied.");
  }

  const messages = await db
    .select()
    .from(schema.coachMessages)
    .where(eq(schema.coachMessages.conversationId, conversationId))
    .orderBy(asc(schema.coachMessages.createdAt));

  return {
    conversation,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      suggestedActions: m.suggestedActions || [],
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function renameConversation(userId: string, conversationId: string, title: string) {
  const [updated] = await db
    .update(schema.coachConversations)
    .set({
      title: title.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.coachConversations.id, conversationId), eq(schema.coachConversations.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Conversation not found or access denied.");
  }

  return updated;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const [deleted] = await db
    .delete(schema.coachConversations)
    .where(and(eq(schema.coachConversations.id, conversationId), eq(schema.coachConversations.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error("Conversation not found or access denied.");
  }

  return deleted;
}

// -----------------------------------------------------------------------------
// 3. GROQ AI & DETERMINISTIC COACH REASONING ENGINE
// -----------------------------------------------------------------------------

const groqCoachResponseSchema = z.object({
  reply: z.string().min(1),
  suggestedActions: z
    .array(
      z.object({
        action: z.string(),
        label: z.string(),
        href: z.string().optional(),
        payload: z.record(z.any()).optional(),
      })
    )
    .default([]),
});

/**
 * Intelligent deterministic rules-based reasoning engine.
 * Generates accurate, tailored clinical advice based directly on the user's recorded
 * metrics, goals, and Pakistani food context when Groq is unavailable.
 */
export function generateDeterministicCoachReply(
  userQuery: string,
  ctx: CoachUserContext,
  language: "en" | "ur" = "en"
): { reply: string; suggestedActions: SuggestedAction[] } {
  const queryLower = userQuery.toLowerCase();
  const isUrdu = language === "ur" || /[\u0600-\u06FF]/.test(userQuery);

  let reply = "";
  const actions: SuggestedAction[] = [];

  // Query: Protein / Diet / Food
  if (queryLower.includes("protein") || queryLower.includes("diet") || queryLower.includes("food") || queryLower.includes("کھانا") || queryLower.includes("پروٹین")) {
    const targetProt = ctx.profile?.targetProteinGrams || 120;
    const actualProt = ctx.nutrition.avgActualProteinPast7d || 0;
    const gap = targetProt - actualProt;

    if (isUrdu) {
      reply = `السلام علیکم ${ctx.athleteName}! آپ کی غذائی معلومات کے مطابق:\n\n` +
        `• آپ کا روزانہ پروٹین کا ہدف: **${targetProt} گرام** ہے۔\n` +
        `• گزشتہ 7 دنوں کا اوسط حصول: **${actualProt > 0 ? `${actualProt} گرام` : "ابھی تک لاگ نہیں کیا گیا"}** ہے۔\n\n` +
        (gap > 15
          ? `آپ فی الحال ہدف سے تقریباً **${Math.round(gap)} گرام** پیچھے ہیں۔ پاکستان میں مناسب قیمت میں پروٹین بڑھانے کے لیے:\n` +
            `1. **دال چنا یا کالا چنا**: 1 کپ پکی ہوئی دال سے ~15-18 گرام سستی اور معیاری پروٹین ملتی ہے۔\n` +
            `2. **فارمی انڈے**: روزانہ 2 سے 3 ابلے ہوئے انڈے (~18 گرام پروٹین) شامل کریں۔\n` +
            `3. **چکن بریسٹ یا دہی**: دوپہر کے کھانے میں دہی یا چکن شامل کریں۔`
          : `ماشاءاللہ، آپ اپنی پروٹین کی مقدار کا تسلسل اچھے طریقے سے برقرار رکھ رہے ہیں۔ اس سے عضلات کی بحالی اور چکنائی کم کرنے میں مدد ملے گی۔`);
    } else {
      reply = `Hello ${ctx.athleteName}! Based on your physical assessment and nutrition logs:\n\n` +
        `• **Target Daily Protein**: **${targetProt}g**\n` +
        `• **Recent 7-Day Average**: **${actualProt > 0 ? `${actualProt}g/day` : "No recent logs"}**\n\n` +
        (gap > 15
          ? `You are currently ~**${Math.round(gap)}g** below your optimal protein threshold. Here are cost-effective Pakistani staples to bridge this gap:\n` +
            `1. **Farm Eggs**: 2 whole eggs provide ~12.6g protein at ~PKR 60.\n` +
            `2. **Daal Chana (Split Chickpeas)**: 1 cooked cup provides ~17.8g protein at low cost (~PKR 25 per 20g protein).\n` +
            `3. **Low-Fat Yogurt or Chicken Breast**: Add 150g boneless chicken or a bowl of fresh yogurt to lunch or dinner.`
          : `Great job! Your protein intake is well aligned with your daily targets (~${actualProt}g/day). Maintaining this consistency ensures muscle repair and metabolic health.`);
    }

    actions.push({ action: "EXPLORE_FOOD", label: isUrdu ? "غذائی ڈیٹا بیس دیکھیں" : "Explore Pakistani Foods", href: "/foods" });
    actions.push({ action: "REVIEW_DIARY", label: isUrdu ? "ڈائری لاگ کریں" : "Log Today's Meal", href: "/diary" });
    return { reply, suggestedActions: actions };
  }

  // Query: Weight / Progress / Plateau
  if (queryLower.includes("weight") || queryLower.includes("progress") || queryLower.includes("plateau") || queryLower.includes("وزن") || queryLower.includes("ترقی")) {
    const startW = ctx.progress.startingWeightKg || ctx.profile?.currentWeightKg || 0;
    const curW = ctx.progress.currentWeightKg || startW;
    const targetW = ctx.activeGoal?.targetWeightKg;
    const net = ctx.progress.netWeightChangeKg || 0;
    const rate = ctx.progress.weeklyWeightRateKg || 0;

    if (isUrdu) {
      reply = `آپ کی پیش رفت کا تفصیلی تجزیہ:\n\n` +
        `• ابتدائی وزن: **${startW} کلوگرام** ➔ موجودہ وزن: **${curW} کلوگرام**\n` +
        `• مجموعی تبدیلی: **${net > 0 ? `+${net}` : net} کلوگرام** (ہفتہ وار شرح: ${rate > 0 ? `+${rate}` : rate} kg/wk)\n` +
        (targetW ? `• ہدف وزن: **${targetW} کلوگرام** (${ctx.activeGoal?.goalType.replace("_", " ")})\n\n` : "\n\n") +
        `یاد رکھیں کہ وزن میں روزمرہ کا اتار چڑھاؤ پانی اور نمکیات کے توازن کی وجہ سے عام ہے۔ وزن کو ایک واحد پیمانہ نہ سمجھیں؛ اپنی کمر کی پیمائش اور ورزش کی طاقت پر بھی توجہ دیں۔`;
    } else {
      reply = `Here is your transformation trajectory analysis:\n\n` +
        `• **Baseline Weight**: **${startW} kg** ➔ **Current**: **${curW} kg**\n` +
        `• **Net Change**: **${net > 0 ? `+${net}` : net} kg** (Average rate: **${rate > 0 ? `+${rate}` : rate} kg/week**)\n` +
        (targetW ? `• **Target Goal**: **${targetW} kg** for ${ctx.activeGoal?.goalType.replace(/_/g, " ")}\n\n` : "\n\n") +
        `**Key Coaching Takeaway**: Day-to-day scale weight naturally fluctuates by 1–2 kg due to water retention and glycogen storage. Track circumference metrics (like waist) and strength progression alongside the scale to evaluate true fat loss and body recomposition.`;
    }

    actions.push({ action: "VIEW_PROGRESS", label: isUrdu ? "پیش رفت چارٹ دیکھیں" : "View Weight Chart", href: "/progress?tab=weight" });
    actions.push({ action: "RECORD_MEASUREMENT", label: isUrdu ? "کمر کی پیمائش درج کریں" : "Record Waist Measurement", href: "/progress?tab=measurements" });
    return { reply, suggestedActions: actions };
  }

  // Query: Workout / Training / Exercises
  if (queryLower.includes("workout") || queryLower.includes("exercise") || queryLower.includes("gym") || queryLower.includes("ورزش") || queryLower.includes("ٹریننگ")) {
    const workoutsCount = ctx.workouts.completedSessionsPast30d;
    const volume = ctx.workouts.totalVolumeKgPast30d;

    if (isUrdu) {
      reply = `آپ کے تربیتی سیشنز کا جائزہ:\n\n` +
        `• پچھلے 30 دنوں میں مکمل ورزشیں: **${workoutsCount} سیشنز**\n` +
        `• اٹھایا گیا کل بوجھ (والیوم): **${volume.toLocaleString()} کلوگرام**\n\n` +
        (workoutsCount >= 8
          ? `ماشاءاللہ، آپ کا تربیتی تسلسل بہت عمدہ ہے۔ پروگریسو اوورلوڈ (ہر سیشن میں معمولی وزن یا ریپس کا اضافہ) جاری رکھیں تاکہ پٹھے مضبوط ہوں۔`
          : `اگر آپ مستقل نتائج چاہتے ہیں تو ہفتے میں کم از کم 3 دن فل باڈی یا اپر/لوئر اسپلٹ ورزش کا معمول بنائیں اور آرام کے دنوں کا خیال رکھیں۔`);
    } else {
      reply = `Here is a review of your workout performance over the past 30 days:\n\n` +
        `• **Completed Sessions**: **${workoutsCount} workouts**\n` +
        `• **Total Training Volume**: **${volume.toLocaleString()} kg**\n\n` +
        (workoutsCount >= 8
          ? `Outstanding consistency! You are logging regular sessions and applying consistent mechanical tension. Continue focusing on progressive overload (+2.5 kg on compound lifts when you hit the top of your rep target) and ensure 48h recovery per muscle group.`
          : `To maximize body recomposition, aim for 3-4 structured sessions per week. Prioritize foundational multi-joint exercises like squats, push-ups/bench presses, and rows before accessory movements.`);
    }

    actions.push({ action: "OPEN_ROUTINE", label: isUrdu ? "ورزشیں دیکھیں" : "Explore Workout Hub", href: "/workouts" });
    actions.push({ action: "VIEW_EXERCISE", label: isUrdu ? "مشقوں کی لائبریری" : "Exercise Library", href: "/exercises" });
    return { reply, suggestedActions: actions };
  }

  // Query: General fitness guidance
  if (isUrdu) {
    reply = `السلام علیکم ${ctx.athleteName}! بطور آپ کے فٹنس کوچ، میں آپ کے روزانہ کے کھانے، ورزش اور وزن کے ڈیٹا کا جائزہ لے کر آپ کی رہنمائی کر سکتا ہوں۔\n\n` +
      `آپ مجھ سے خوراک، پروٹین کی مقدار، مناسب ورزش، یا وزن کی تبدیلی کے متعلق کوئی بھی سوال بلا جھجھک پوچھ سکتے ہیں۔`;
  } else {
    reply = `Hello ${ctx.athleteName}! As your personal fitness and sports nutrition coach, I synthesize your real assessment numbers, daily nutrition logs, workout volume, and body measurements to keep you on track.\n\n` +
      `Feel free to ask me to analyze your weekly calories, review your workout routine, suggest budget-friendly Pakistani meals, or optimize your fitness goals!`;
  }

  actions.push({ action: "VIEW_PROGRESS", label: isUrdu ? "پیش رفت دیکھیں" : "View Progress", href: "/progress" });
  actions.push({ action: "EXPLORE_FOOD", label: isUrdu ? "کھانوں کی فہرست" : "Foods Database", href: "/foods" });

  return { reply, suggestedActions: actions };
}

/**
 * Sends a message to the AI Fitness Coach.
 * Context is securely assembled and passed to Groq LLaMA-3.3-70B.
 * If Groq is unavailable, gracefully falls back to the deterministic coach engine.
 */
export async function sendMessageToCoach(
  userId: string,
  input: {
    conversationId?: string;
    message: string;
    language?: "en" | "ur";
  }
) {
  // 1. Resolve or create conversation
  let conversationId = input.conversationId;
  if (!conversationId) {
    const initialTitle = input.message.length > 40
      ? `${input.message.substring(0, 37)}...`
      : input.message;

    const [newConvo] = await db
      .insert(schema.coachConversations)
      .values({
        userId,
        title: initialTitle,
      })
      .returning();

    conversationId = newConvo.id;
  } else {
    // Verify ownership
    const [existing] = await db
      .select({ id: schema.coachConversations.id })
      .from(schema.coachConversations)
      .where(and(eq(schema.coachConversations.id, conversationId), eq(schema.coachConversations.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error("Conversation not found or access denied.");
    }
  }

  // 2. Persist user message
  await db.insert(schema.coachMessages).values({
    conversationId,
    userId,
    role: "user",
    content: input.message,
    suggestedActions: [],
  });

  // 3. Build personalized context
  const context = await buildPersonalizedCoachContext(userId);
  const contextSummary = formatCoachContextForPrompt(context);

  // 4. Try Groq AI (llama-3.3-70b-versatile)
  const apiKey = process.env.GROQ_API_KEY;
  let replyText = "";
  let suggestedActions: SuggestedAction[] = [];

  const isUrduQuery = input.language === "ur" || /[\u0600-\u06FF]/.test(input.message);

  if (apiKey && apiKey.trim() !== "" && apiKey !== "mock_or_empty") {
    const systemPrompt = `You are Coach Hamza, FitLife AI's expert personal fitness and clinical sports nutrition coach.
You specialize in evidence-based exercise science and culturally authentic Pakistani nutrition (roti, daal, farm eggs, chicken, local market pricing in PKR).

SAFETY & CLINICAL GUARDRAILS:
1. NEVER diagnose medical conditions or prescribe pharmaceuticals/drugs.
2. If the user mentions sharp joint pain, chest tightness, dizziness, injury, or eating disorders, prioritize advising immediate qualified medical care.
3. NEVER promise rapid weight loss or unrealistic transformations. Emphasize sustainable habits (0.25 - 1 kg/wk safe change rate).
4. Be concise, encouraging, and actionable. Avoid rambling paragraphs.
5. You MUST return a valid JSON object matching the requested schema.

ATHLETE REAL CONTEXT (Scoped strictly to this user):
${contextSummary}

${isUrduQuery ? "CRITICAL: The user is communicating in Urdu. Respond in natural, warm, grammatically correct Urdu." : "Respond in clean, encouraging English."}`;

    const userPrompt = `User question: "${input.message}"

Respond strictly with a JSON object:
{
  "reply": "Your coaching advice in markdown with bullet points",
  "suggestedActions": [
    {
      "action": "EXPLORE_FOOD" | "OPEN_ROUTINE" | "VIEW_PROGRESS" | "REVIEW_DIARY" | "REVIEW_GOALS",
      "label": "Brief button text",
      "href": "/foods" | "/workouts" | "/progress" | "/diary" | "/goals"
    }
  ]
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const validated = groqCoachResponseSchema.safeParse(parsed);
          if (validated.success) {
            replyText = validated.data.reply;
            suggestedActions = validated.data.suggestedActions as SuggestedAction[];
          }
        }
      }
    } catch (err) {
      console.warn("[Groq AI Coach] Call failed or timed out. Switching to deterministic coach:", err);
    }
  }

  // 5. Fallback if Groq unavailable or failed
  if (!replyText) {
    const fallback = generateDeterministicCoachReply(input.message, context, input.language || "en");
    replyText = fallback.reply;
    suggestedActions = fallback.suggestedActions;
  }

  // 6. Persist assistant message
  const [assistantMsg] = await db
    .insert(schema.coachMessages)
    .values({
      conversationId,
      userId,
      role: "assistant",
      content: replyText,
      suggestedActions,
    })
    .returning();

  // 7. Update conversation timestamp
  await db
    .update(schema.coachConversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.coachConversations.id, conversationId));

  return {
    conversationId,
    message: {
      id: assistantMsg.id,
      role: "assistant",
      content: assistantMsg.content,
      suggestedActions: assistantMsg.suggestedActions,
      createdAt: assistantMsg.createdAt.toISOString(),
    },
  };
}

export async function applyCoachRecommendation(userId: string, recommendationId: string) {
  const [rec] = await db
    .select()
    .from(schema.coachRecommendations)
    .where(and(eq(schema.coachRecommendations.id, recommendationId), eq(schema.coachRecommendations.userId, userId)))
    .limit(1);

  if (!rec) {
    throw new Error("Recommendation not found or access denied.");
  }

  const [updated] = await db
    .update(schema.coachRecommendations)
    .set({
      isApplied: true,
      appliedAt: new Date(),
    })
    .where(eq(schema.coachRecommendations.id, recommendationId))
    .returning();

  return updated;
}

