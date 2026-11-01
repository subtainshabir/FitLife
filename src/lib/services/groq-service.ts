import { z } from "zod";

export interface FoodCatalogItemForAI {
  id: string;
  nameEn: string;
  nameUr: string;
  category: string;
  defaultServingSize: number;
  defaultServingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
  pricePkr?: number;
  priceUnit?: string;
  costPer20gProtein?: number | null;
}

const groqMealItemSchema = z.object({
  foodItemId: z.string().describe("Must match an exact id from the provided food catalog"),
  quantity: z.number().min(0.1),
  unit: z.string(),
  notes: z.string().optional(),
});

const groqMealSchema = z.object({
  mealType: z.enum(["breakfast", "morning_snack", "lunch", "evening_snack", "dinner"]),
  nameEn: z.string(),
  nameUr: z.string(),
  prepTimeMinutes: z.number().default(15),
  instructions: z.string().describe("Pakistani cooking and preparation instructions in English and Urdu"),
  items: z.array(groqMealItemSchema).min(1),
});

const groqPlanOutputSchema = z.object({
  meals: z.array(groqMealSchema).min(3),
  aiNotes: z.string().describe("Clinical nutritionist feedback, budget analysis, and tips for the user"),
});

export type GroqPlanOutput = z.infer<typeof groqPlanOutputSchema>;
export type GroqMealOutput = z.infer<typeof groqMealSchema>;

export interface PlanGenerationContext {
  goal: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetFibreGrams: number;
  dailyBudget: number;
  currency: string;
  city: string;
  mealsPerDay: number;
  cookingTimeMinutes: number;
  dietaryType: string;
  allergies: string[];
  excludedFoods: string[];
  dietaryRestrictions: string[];
  preferredFoods: string[];
}

/**
 * Invokes Groq Llama-3.3-70b-versatile with JSON mode to formulate a culturally authentic
 * Pakistani meal plan using strictly real foods from the provided database catalog.
 * Returns null on any error, timeout, or missing API key, triggering immediate deterministic fallback.
 */
export async function generatePlanWithGroq(
  context: PlanGenerationContext,
  availableCatalog: FoodCatalogItemForAI[]
): Promise<GroqPlanOutput | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "mock_or_empty") {
    return null;
  }

  // Filter catalog by excluded foods and allergies
  const safeCatalog = availableCatalog.filter((food) => {
    const nameLower = food.nameEn.toLowerCase();
    const isExcluded = context.excludedFoods.some((ex) => nameLower.includes(ex.toLowerCase()));
    const isAllergic = context.allergies.some((al) => nameLower.includes(al.toLowerCase()));
    return !isExcluded && !isAllergic;
  });

  const catalogSummary = safeCatalog.map((f) => ({
    id: f.id,
    name: f.nameEn,
    urdu: f.nameUr,
    category: f.category,
    unit: f.defaultServingUnit,
    cal100g: f.caloriesPer100g,
    pro100g: f.proteinPer100g,
    carb100g: f.carbsPer100g,
    fat100g: f.fatPer100g,
    pricePkr: f.pricePkr ?? null,
    costPer20gProtein: f.costPer20gProtein ?? null,
  }));

  const systemPrompt = `You are FitLife AI, a clinical sports dietitian specializing in localized Pakistani nutrition and budget-friendly diet plans.
You are tasked with generating a culturally authentic daily Pakistani meal plan for an individual in ${context.city}, Pakistan.

CRITICAL CONSTRAINTS:
1. ONLY select foods from the provided catalog. Every single ingredient item MUST contain the EXACT "foodItemId" corresponding to the "id" field in the catalog.
2. The user has ${context.mealsPerDay} meals per day.
3. Daily Targets:
   - Calories: ~${Math.round(context.targetCalories)} kcal
   - Protein: ~${Math.round(context.targetProteinGrams)} g
   - Carbs: ~${Math.round(context.targetCarbsGrams)} g
   - Fat: ~${Math.round(context.targetFatGrams)} g
   - Daily Budget: ${Math.round(context.dailyBudget)} ${context.currency}
   - Max Cooking Time: ${context.cookingTimeMinutes} minutes
   - Goal: ${context.goal}
   - Dietary Style: ${context.dietaryType}
4. When budget is tight (e.g. under 500 PKR), heavily emphasize affordable protein sources from the catalog (such as Daal Chana, Farm Eggs, Milk, Low-fat Yogurt) rather than costly boneless meats.
5. Provide detailed Pakistani cooking instructions in the "instructions" field for each meal (e.g., how to prepare bhurji, dal tadka, or chapati).
6. Provide an informative "aiNotes" summary explaining how the plan achieves their fitness goal while respecting their budget in ${context.city}.
7. Return ONLY a valid JSON object matching the requested schema. No markdown formatting outside of JSON.`;

  const userPrompt = `Catalog of Verified Foods in Pakistan:
${JSON.stringify(catalogSummary, null, 1)}

Required JSON Schema:
{
  "meals": [
    {
      "mealType": "breakfast" | "morning_snack" | "lunch" | "evening_snack" | "dinner",
      "nameEn": "English Recipe Name",
      "nameUr": "Urdu Recipe Name",
      "prepTimeMinutes": number,
      "instructions": "Step-by-step Pakistani recipe guide",
      "items": [
        {
          "foodItemId": "exact id from catalog",
          "quantity": number,
          "unit": "g" | "piece" | "cup" | "tbsp" | "ml"
        }
      ]
    }
  ],
  "aiNotes": "Nutritional and budget insights"
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

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
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Groq AI] HTTP error ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsedJson = JSON.parse(content);
    const validated = groqPlanOutputSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.warn("[Groq AI] Schema validation failed:", validated.error.issues);
      return null;
    }

    // Verify all foodItemIds actually exist in safeCatalog
    const validIds = new Set(safeCatalog.map((c) => c.id));
    for (const meal of validated.data.meals) {
      for (const item of meal.items) {
        if (!validIds.has(item.foodItemId)) {
          console.warn(`[Groq AI] Returned unknown foodItemId: ${item.foodItemId}`);
          return null;
        }
      }
    }

    return validated.data;
  } catch (err) {
    console.warn("[Groq AI] Call failed or timed out, switching to deterministic engine:", err);
    return null;
  }
}

/**
 * Regenerates a single meal slot using Groq.
 */
export async function regenerateMealWithGroq(
  mealType: string,
  targetCalories: number,
  targetProtein: number,
  preference: string,
  availableCatalog: FoodCatalogItemForAI[]
): Promise<GroqMealOutput | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "mock_or_empty") {
    return null;
  }

  const catalogSummary = availableCatalog.map((f) => ({
    id: f.id,
    name: f.nameEn,
    urdu: f.nameUr,
    category: f.category,
    unit: f.defaultServingUnit,
    cal100g: f.caloriesPer100g,
    pro100g: f.proteinPer100g,
    pricePkr: f.pricePkr ?? null,
  }));

  const systemPrompt = `You are FitLife AI. Regenerate ONE single meal slot (${mealType}) for a Pakistani user.
Target Calories for this meal: ~${Math.round(targetCalories)} kcal.
Target Protein for this meal: ~${Math.round(targetProtein)} g.
User Preference: ${preference} (e.g. cheaper, higher_protein, quick_prep, or balanced).
Select ONLY from the provided catalog items using exact "id" as "foodItemId".
Return a single JSON object conforming to:
{
  "mealType": "${mealType}",
  "nameEn": string,
  "nameUr": string,
  "prepTimeMinutes": number,
  "instructions": string,
  "items": [{ "foodItemId": string, "quantity": number, "unit": string }]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
          { role: "user", content: JSON.stringify(catalogSummary) },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsedJson = JSON.parse(content);
    const validated = groqMealSchema.safeParse(parsedJson);

    if (!validated.success) return null;

    const validIds = new Set(availableCatalog.map((c) => c.id));
    for (const item of validated.data.items) {
      if (!validIds.has(item.foodItemId)) return null;
    }

    return validated.data;
  } catch (err) {
    console.warn("[Groq AI Single Meal] Failed:", err);
    return null;
  }
}

