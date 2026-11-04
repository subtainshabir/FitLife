import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import postgres from "postgres";

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set in .env.local");
  }
  console.log(`Connecting to ${dbUrl}...`);
  const sql = postgres(dbUrl, { max: 1 });

  try {
    const migrationPath = path.join(process.cwd(), "drizzle", "0007_steep_kitty_pryde.sql");
    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    console.log("Applying migration 0007_steep_kitty_pryde.sql for Phase 8...");

    // Split statements by --> statement-breakpoint
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await sql.unsafe(statement);
    }

    console.log("Migration 0004_silent_multiple_man.sql applied successfully!");

    // Verify created tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Tables in database:", tables.map((t: any) => t.table_name));
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
