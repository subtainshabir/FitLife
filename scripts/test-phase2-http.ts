import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testPhase2Http() {
  console.log(`=== TESTING PHASE 2 HTTP ENDPOINTS AT ${BASE_URL} ===\n`);

  // 1. Unauthenticated access security checks
  const protectedEndpoints = [
    { method: "POST", path: "/api/v1/assessments/calculate", body: {} },
    { method: "GET", path: "/api/v1/assessments/latest" },
    { method: "GET", path: "/api/v1/assessments/history" },
    { method: "POST", path: "/api/v1/goals", body: {} },
    { method: "GET", path: "/api/v1/goals" },
    { method: "PATCH", path: "/api/v1/goals/00000000-0000-0000-0000-000000000000", body: {} },
    { method: "DELETE", path: "/api/v1/goals/00000000-0000-0000-0000-000000000000" },
    { method: "POST", path: "/api/v1/progress/weight", body: {} },
    { method: "GET", path: "/api/v1/progress/weight" },
  ];

  console.log("[1] Verifying 401 Unauthorized rejection on all protected Phase 2 endpoints...");
  for (const ep of protectedEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.path}`, {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });

    if (res.status !== 401) {
      throw new Error(`Security failure: Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
    }
    console.log(`✓ PASS: ${ep.method} ${ep.path} rejected with 401 Unauthorized`);
  }

  // 2. Frontend Page Availability
  const pages = ["/assessment", "/goals", "/dashboard", "/profile"];
  console.log("\n[2] Verifying Frontend Pages Return HTTP 200...");
  for (const page of pages) {
    const res = await fetch(`${BASE_URL}${page}`);
    if (res.status !== 200) {
      throw new Error(`Page ${page} failed with HTTP ${res.status}`);
    }
    console.log(`✓ PASS: Page ${page} responded with HTTP 200 OK`);
  }

  console.log("\n=======================================================");
  console.log("ALL PHASE 2 HTTP & SECURITY VERIFICATIONS PASSED! ✓");
  console.log("=======================================================\n");
}

testPhase2Http().catch((err) => {
  console.error("HTTP test failure:", err.message);
  process.exit(1);
});

