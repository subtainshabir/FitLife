import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testEndpoints() {
  console.log(`=== TESTING HTTP ENDPOINTS AT ${BASE_URL} ===\n`);

  // 1. Health check
  console.log("[1] Testing GET /api/v1/health...");
  const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
  const healthData = await healthRes.json();
  console.log(`Status: ${healthRes.status}`, healthData);
  if (healthRes.status !== 200 || healthData.status !== "healthy") {
    throw new Error("Health check failed!");
  }
  console.log("✓ PASS: Health check endpoint working.\n");

  // 2. Unauthenticated access check on /api/v1/users/me
  console.log("[2] Testing Unauthorized Access on GET /api/v1/users/me...");
  const unauthRes = await fetch(`${BASE_URL}/api/v1/users/me`);
  console.log(`Status: ${unauthRes.status}`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401, got ${unauthRes.status}`);
  }
  console.log("✓ PASS: Unauthenticated access rejected with 401.\n");

  // 3. Unauthenticated access check on /api/v1/profiles/me
  console.log("[3] Testing Unauthorized Access on GET /api/v1/profiles/me...");
  const unauthProfileRes = await fetch(`${BASE_URL}/api/v1/profiles/me`);
  console.log(`Status: ${unauthProfileRes.status}`);
  if (unauthProfileRes.status !== 401) {
    throw new Error(`Expected 401, got ${unauthProfileRes.status}`);
  }
  console.log("✓ PASS: Unauthenticated profile access rejected with 401.\n");

  // 4. Registration validation check (short password)
  console.log("[4] Testing Registration Validation on Invalid Input...");
  const invalidReg = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      email: "invalid-email",
      password: "123",
    }),
  });
  console.log(`Status: ${invalidReg.status}`);
  const invalidData = await invalidReg.json();
  if (invalidReg.status !== 400 || !invalidData.details) {
    throw new Error("Expected 400 with validation details");
  }
  console.log("✓ PASS: Invalid input rejected with 400 and validation error details.\n");

  // 5. Successful registration
  const uniqueEmail = `athlete_web_${Date.now()}@fitlife.ai`;
  console.log(`[5] Testing User Registration for ${uniqueEmail}...`);
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Usman Tariq",
      email: uniqueEmail,
      password: "Password123!",
    }),
  });
  console.log(`Status: ${regRes.status}`);
  const regData = await regRes.json();
  console.log("Response:", regData);
  if (regRes.status !== 201 || !regData.user?.id) {
    throw new Error("Registration failed!");
  }
  console.log("✓ PASS: User registered successfully with 201 Created.\n");

  // 6. Duplicate registration
  console.log("[6] Testing Duplicate Email Registration...");
  const dupRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Usman Tariq",
      email: uniqueEmail,
      password: "Password123!",
    }),
  });
  console.log(`Status: ${dupRes.status}`);
  const dupData = await dupRes.json();
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict, got ${dupRes.status}`);
  }
  console.log("✓ PASS: Duplicate email rejected with 409 Conflict.\n");

  // 7. Verify frontend pages return 200
  const pages = ["/", "/login", "/register", "/dashboard", "/onboarding", "/profile"];
  console.log("[7] Testing Frontend Page HTTP Statuses...");
  for (const page of pages) {
    const res = await fetch(`${BASE_URL}${page}`);
    console.log(`Page ${page}: ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Page ${page} returned status ${res.status}`);
    }
  }
  console.log("✓ PASS: All frontend pages render successfully with 200 OK.\n");

  console.log("=== ALL HTTP ENDPOINTS & PAGES VERIFIED SUCCESSFULLY! ===");
}

testEndpoints().catch((err) => {
  console.error("HTTP verification error:", err);
  process.exit(1);
});

