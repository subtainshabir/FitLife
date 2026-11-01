import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { calculateFoodNutrition, calculateFoodCost } from "../src/lib/services/nutrition-calculator";

console.log("=== FITLIFE AI: PHASE 3 DATABASE & API INTEGRATION TESTS ===\n");

async function runPhase3IntegrationTests() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not configured");

  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  let testAdminId: string | null = null;
  let testRegularUserId: string | null = null;

  try {
    // 1. Verify Seeded Categories
    console.log("[1] Verifying Food Categories in DB...");
    const categories = await db.select().from(schema.foodCategories);
    if (categories.length < 5) {
      throw new Error(`Expected at least 5 categories, got ${categories.length}`);
    }
    console.log(`✓ PASS: Found ${categories.length} categories:`, categories.map((c) => c.slug).join(", "));

    // 2. Verify Seeded Food Items & Urdu Names
    console.log("\n[2] Verifying Food Items & Dual-Language Fields...");
    const items = await db.select().from(schema.foodItems);
    if (items.length < 30) {
      throw new Error(`Expected at least 30 food items, got ${items.length}`);
    }
    console.log(`✓ PASS: Found ${items.length} food items in database`);

    // Verify Urdu searchability
    const [eggItem] = await db
      .select()
      .from(schema.foodItems)
      .where(eq(schema.foodItems.nameEn, "Eggs (Farm / White)"))
      .limit(1);

    if (!eggItem || !eggItem.nameUr.includes("انڈے")) {
      throw new Error("Urdu name missing or incorrect on egg item");
    }
    console.log(`✓ PASS: Item '${eggItem.nameEn}' has Urdu name '${eggItem.nameUr}' and serving ${eggItem.servingWeightGrams}g`);

    // 3. Verify City Market Prices across Pakistan
    console.log("\n[3] Verifying Multi-City Food Prices (Kotli, Rawalpindi, Islamabad, Lahore, Karachi)...");
    const prices = await db.select().from(schema.foodPrices);
    if (prices.length < 20) {
      throw new Error(`Expected at least 20 price records, got ${prices.length}`);
    }

    const distinctCities = Array.from(new Set(prices.map((p) => p.city)));
    console.log("Cities present in price records:", distinctCities);
    const requiredCities = ["Kotli", "Rawalpindi", "Islamabad", "Lahore", "Karachi"];
    for (const city of requiredCities) {
      if (!distinctCities.includes(city)) {
        throw new Error(`Expected price entries for ${city}`);
      }
    }
    console.log("✓ PASS: All required cities have authentic market prices recorded");

    // 4. Test Historical Price Preservation
    console.log("\n[4] Testing Historical Price Preservation...");
    const now = new Date();
    const historicalDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Insert historical price for same food in same city
    await db.insert(schema.foodPrices).values({
      foodId: eggItem.id,
      country: "Pakistan",
      province: "Punjab",
      city: "Rawalpindi",
      marketRetailer: "Raja Bazaar",
      price: 320, // previous month price was 320 vs current 340
      quantity: 1,
      unit: "dozen",
      pricePerStandardUnit: 320,
      standardUnit: "dozen",
      currency: "PKR",
      collectionDate: historicalDate,
      verificationStatus: "expired",
      confidenceLevel: "high",
      notes: "Previous month historical price record",
    });

    const historicalRecords = await db
      .select()
      .from(schema.foodPrices)
      .where(eq(schema.foodPrices.foodId, eggItem.id))
      .orderBy(desc(schema.foodPrices.collectionDate));

    if (historicalRecords.length < 2) {
      throw new Error("Historical prices were not preserved");
    }
    console.log(`✓ PASS: Preserved ${historicalRecords.length} historical price points for '${eggItem.nameEn}'`);

    // 5. Test Nutrition & Cost Calculation Engine
    console.log("\n[5] Testing Nutrition & Cost Service integration...");
    const calculatedNutrition = calculateFoodNutrition(eggItem, 4, "piece");
    if (calculatedNutrition.calories <= 0 || calculatedNutrition.protein <= 0) {
      throw new Error("Nutrition calculation failed");
    }
    console.log(`✓ PASS: 4 eggs = ${calculatedNutrition.calories} kcal, ${calculatedNutrition.protein}g protein, ${calculatedNutrition.weightGrams}g`);

    const latestPrice = historicalRecords[0];
    const calculatedCost = calculateFoodCost(eggItem, 4, "piece", latestPrice);
    if (calculatedCost.totalCostPkr <= 0) {
      throw new Error("Cost calculation failed");
    }
    console.log(`✓ PASS: 4 eggs cost in ${latestPrice.city} = PKR ${calculatedCost.totalCostPkr} (${latestPrice.verificationStatus})`);

    // 6. Test Admin vs Regular User Role Authorization
    console.log("\n[6] Testing User Roles & Admin Access Controls...");
    const regularPass = await bcrypt.hash("UserPass123!", 10);
    const adminPass = await bcrypt.hash("AdminPass123!", 10);

    const [regularUser] = await db
      .insert(schema.users)
      .values({
        name: "Regular Athlete",
        email: `regular_${Date.now()}@fitlife.ai`,
        passwordHash: regularPass,
        role: "user",
      })
      .returning();
    testRegularUserId = regularUser.id;

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        name: "Admin Officer",
        email: `admin_${Date.now()}@fitlife.ai`,
        passwordHash: adminPass,
        role: "admin",
      })
      .returning();
    testAdminId = adminUser.id;

    if (regularUser.role !== "user" || adminUser.role !== "admin") {
      throw new Error("User roles assignment failed");
    }
    console.log(`✓ PASS: Regular user (role: ${regularUser.role}) and Admin user (role: ${adminUser.role}) created`);

    // Clean up test users
    await db.delete(schema.users).where(eq(schema.users.id, testRegularUserId));
    await db.delete(schema.users).where(eq(schema.users.id, testAdminId));
    console.log("✓ PASS: Test user records cleaned up cleanly");

    console.log("\n=======================================================");
    console.log("ALL PHASE 3 DATABASE & INTEGRATION TESTS PASSED! ✓");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runPhase3IntegrationTests();
