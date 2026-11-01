import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { NextRequest } from "next/server";
import { GET as getFoods } from "../src/app/api/v1/foods/route";
import { GET as getCategories } from "../src/app/api/v1/foods/categories/route";
import { GET as searchFoods } from "../src/app/api/v1/foods/search/route";
import { GET as getFoodById } from "../src/app/api/v1/foods/[id]/route";
import { GET as getFoodPricesById } from "../src/app/api/v1/foods/[id]/prices/route";
import { GET as getPricesCatalog } from "../src/app/api/v1/foods/prices/route";
import { GET as comparePrices } from "../src/app/api/v1/foods/prices/compare/route";
import { POST as calculateNutrition } from "../src/app/api/v1/foods/calculate-nutrition/route";
import { POST as calculateCost } from "../src/app/api/v1/foods/calculate-cost/route";
import { POST as adminCreateFood } from "../src/app/api/v1/admin/foods/route";
import { POST as adminCreatePrice } from "../src/app/api/v1/admin/food-prices/route";
import { GET as adminGetPendingPrices } from "../src/app/api/v1/admin/food-prices/pending/route";

console.log("=== FITLIFE AI: PHASE 3 ROUTE HANDLER & SECURITY INTEGRATION TESTS ===\n");

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

async function runHttpTests() {
  // 1. GET /api/v1/foods/categories
  console.log("[1] Testing GET /api/v1/foods/categories...");
  const catReq = new NextRequest("http://localhost:3000/api/v1/foods/categories");
  const catRes = await getCategories();
  assert(catRes.status === 200, "Categories returns 200 OK");
  const catJson = await catRes.json();
  assert(catJson.categories.length >= 5, `Returned ${catJson.categories.length} categories with icons and counts`);

  // 2. GET /api/v1/foods (with pagination & sorting)
  console.log("\n[2] Testing GET /api/v1/foods...");
  const foodsReq = new NextRequest("http://localhost:3000/api/v1/foods?pageSize=10&page=1&city=Rawalpindi");
  const foodsRes = await getFoods(foodsReq);
  assert(foodsRes.status === 200, "Foods catalog returns 200 OK");
  const foodsJson = await foodsRes.json();
  assert(foodsJson.foods.length === 10, "Paginated to exactly 10 foods");
  assert(foodsJson.pagination.totalItems >= 40, `Total items count is ${foodsJson.pagination.totalItems}`);
  const firstFood = foodsJson.foods[0];
  assert(!!firstFood.nameEn && !!firstFood.nameUr, `Bilingual names present: ${firstFood.nameEn} / ${firstFood.nameUr}`);

  // 3. GET /api/v1/foods/search in English and Urdu
  console.log("\n[3] Testing GET /api/v1/foods/search (English & Urdu)...");
  const enSearchReq = new NextRequest("http://localhost:3000/api/v1/foods/search?q=chicken");
  const enSearchRes = await searchFoods(enSearchReq);
  assert(enSearchRes.status === 200, "English search returns 200 OK");
  const enSearchJson = await enSearchRes.json();
  assert(enSearchJson.foods.length > 0, `English query 'chicken' matched ${enSearchJson.foods.length} items`);

  const urSearchReq = new NextRequest("http://localhost:3000/api/v1/foods/search?q=" + encodeURIComponent("مرغی"));
  const urSearchRes = await searchFoods(urSearchReq);
  assert(urSearchRes.status === 200, "Urdu search returns 200 OK");
  const urSearchJson = await urSearchRes.json();
  assert(urSearchJson.foods.length > 0, `Urdu query 'مرغی' matched ${urSearchJson.foods.length} items`);

  // 4. GET /api/v1/foods/[id]
  console.log("\n[4] Testing GET /api/v1/foods/[id]...");
  const targetFoodId = firstFood.id;
  const detailReq = new NextRequest(`http://localhost:3000/api/v1/foods/${targetFoodId}`);
  const detailRes = await getFoodById(detailReq, { params: { id: targetFoodId } });
  assert(detailRes.status === 200, "Food detail returns 200 OK");
  const detailJson = await detailRes.json();
  assert(detailJson.food.id === targetFoodId, "Food detail ID matches requested ID");
  assert(detailJson.food.nutritionSource.length > 0, `Nutrition source identified: ${detailJson.food.nutritionSource}`);

  // 5. GET /api/v1/foods/[id]/prices
  console.log("\n[5] Testing GET /api/v1/foods/[id]/prices...");
  const pricesReq = new NextRequest(`http://localhost:3000/api/v1/foods/${targetFoodId}/prices`);
  const pricesRes = await getFoodPricesById(pricesReq, { params: { id: targetFoodId } });
  assert(pricesRes.status === 200, "Food prices history returns 200 OK");
  const pricesJson = await pricesRes.json();
  assert(Array.isArray(pricesJson.prices), "Prices array returned");

  // 6. GET /api/v1/foods/prices (with city filter)
  console.log("\n[6] Testing GET /api/v1/foods/prices across Pakistani cities...");
  const catalogReq = new NextRequest("http://localhost:3000/api/v1/foods/prices?city=Rawalpindi");
  const catalogRes = await getPricesCatalog(catalogReq);
  assert(catalogRes.status === 200, "Prices catalog returns 200 OK");
  const catalogJson = await catalogRes.json();
  assert(catalogJson.availableCities.length >= 5, `Available cities >= 5: ${catalogJson.availableCities.map((c: any) => c.city).join(", ")}`);

  // 7. GET /api/v1/foods/prices/compare (Protein cost efficiency)
  console.log("\n[7] Testing GET /api/v1/foods/prices/compare (Protein Leaderboard)...");
  const compareReq = new NextRequest("http://localhost:3000/api/v1/foods/prices/compare?city=Rawalpindi");
  const compareRes = await comparePrices(compareReq);
  assert(compareRes.status === 200, "Compare protein returns 200 OK");
  const compareJson = await compareRes.json();
  assert(compareJson.ranking.length >= 2, `Ranked ${compareJson.ranking.length} protein sources in Rawalpindi`);
  assert(compareJson.ranking[0].costPer20gProtein <= compareJson.ranking[1].costPer20gProtein, "Ranked in ascending cost order");

  // 8. POST /api/v1/foods/calculate-nutrition (Single & Batch)
  console.log("\n[8] Testing POST /api/v1/foods/calculate-nutrition...");
  const singleNutReq = new NextRequest("http://localhost:3000/api/v1/foods/calculate-nutrition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId: targetFoodId, quantity: 2, unit: "serving" }),
  });
  const singleNutRes = await calculateNutrition(singleNutReq);
  assert(singleNutRes.status === 200, "Single nutrition calculation returns 200 OK");
  const singleNutJson = await singleNutRes.json();
  assert(singleNutJson.nutrition.calories > 0, `Calculated calories: ${singleNutJson.nutrition.calories}`);

  // Batch nutrition
  const batchNutReq = new NextRequest("http://localhost:3000/api/v1/foods/calculate-nutrition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      foods: [
        { foodId: targetFoodId, quantity: 1, unit: "serving" },
        { foodId: targetFoodId, quantity: 100, unit: "g" },
      ],
    }),
  });
  const batchNutRes = await calculateNutrition(batchNutReq);
  assert(batchNutRes.status === 200, "Batch meal calculation returns 200 OK");
  const batchNutJson = await batchNutRes.json();
  assert(batchNutJson.totalItems === 2, "Batch processed 2 items correctly");
  assert(batchNutJson.totals.calories > 0, `Batch total calories: ${batchNutJson.totals.calories}`);

  // 9. POST /api/v1/foods/calculate-cost
  console.log("\n[9] Testing POST /api/v1/foods/calculate-cost...");
  const costReq = new NextRequest("http://localhost:3000/api/v1/foods/calculate-cost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId: targetFoodId, quantity: 1, unit: "serving", city: "Rawalpindi" }),
  });
  const costRes = await calculateCost(costReq);
  assert(costRes.status === 200 || costRes.status === 404, "Cost route returns valid response code");
  if (costRes.status === 200) {
    const costJson = await costRes.json();
    assert(costJson.cost.estimatedCostPkr > 0, `Calculated cost PKR ${costJson.cost.estimatedCostPkr}`);
  }

  // 10. Security Checks on Admin Endpoints (Must reject unauthenticated / non-admin requests)
  console.log("\n[10] Testing Security on Admin Endpoints (RBAC)...");
  const unauthFoodReq = new NextRequest("http://localhost:3000/api/v1/admin/foods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nameEn: "Test Food", nameUr: "ٹیسٹ فوڈ", categoryId: "123" }),
  });
  const unauthFoodRes = await adminCreateFood(unauthFoodReq);
  assert(unauthFoodRes.status === 401, "Admin food creation rejected without auth (401 Unauthorized)");

  const unauthPriceReq = new NextRequest("http://localhost:3000/api/v1/admin/food-prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId: targetFoodId, city: "Kotli", price: 200, quantity: 1, unit: "kg" }),
  });
  const unauthPriceRes = await adminCreatePrice(unauthPriceReq);
  assert(unauthPriceRes.status === 401, "Admin price creation rejected without auth (401 Unauthorized)");

  const unauthPendingRes = await adminGetPendingPrices();
  assert(unauthPendingRes.status === 401, "Admin pending prices query rejected without auth (401 Unauthorized)");

  console.log(`\n=======================================================`);
  console.log(`ALL ${passed}/${total} ROUTE HANDLER & SECURITY TESTS PASSED! ✓`);
  console.log(`=======================================================\n`);
  process.exit(0);
}

runHttpTests().catch((err) => {
  console.error("HTTP test failed:", err);
  process.exit(1);
});
