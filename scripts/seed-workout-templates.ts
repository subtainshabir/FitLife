import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { STARTER_ROUTINE_TEMPLATES } from "../src/lib/services/workout-service";

async function seedWorkoutTemplates() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not found");

  console.log("=== SEEDING PHASE 6 WORKOUT ROUTINE TEMPLATES ===");
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // 1. Fetch all exercises to map slug -> id
    const allExercises = await db.select({ id: schema.exercises.id, slug: schema.exercises.slug }).from(schema.exercises);
    const exerciseMap = new Map<string, string>();
    for (const ex of allExercises) {
      exerciseMap.set(ex.slug, ex.id);
    }
    console.log(`Found ${allExercises.length} existing exercises in database.`);

    for (const template of STARTER_ROUTINE_TEMPLATES) {
      console.log(`\nProcessing template: "${template.name}"...`);

      // Check if template already exists
      const existing = await db
        .select()
        .from(schema.workoutRoutines)
        .where(
          and(
            eq(schema.workoutRoutines.name, template.name),
            eq(schema.workoutRoutines.isTemplate, true)
          )
        );

      let routineId: string;

      if (existing.length > 0) {
        routineId = existing[0].id;
        console.log(`Template already exists (id: ${routineId}), updating fields...`);
        await db
          .update(schema.workoutRoutines)
          .set({
            nameUr: template.nameUr,
            description: template.description,
            descriptionUr: template.descriptionUr,
            difficulty: template.difficulty,
            targetDurationMinutes: template.targetDurationMinutes,
            splitType: template.splitType,
            tags: template.tags,
            updatedAt: new Date(),
          })
          .where(eq(schema.workoutRoutines.id, routineId));

        // Delete existing routine exercises to re-seed cleanly
        await db
          .delete(schema.routineExercises)
          .where(eq(schema.routineExercises.routineId, routineId));
      } else {
        const [inserted] = await db
          .insert(schema.workoutRoutines)
          .values({
            userId: null,
            name: template.name,
            nameUr: template.nameUr,
            description: template.description,
            descriptionUr: template.descriptionUr,
            difficulty: template.difficulty,
            targetDurationMinutes: template.targetDurationMinutes,
            splitType: template.splitType,
            tags: template.tags,
            isTemplate: true,
            isArchived: false,
          })
          .returning();
        routineId = inserted.id;
        console.log(`Created new routine template (id: ${routineId})`);
      }

      // Insert routine exercises
      for (const exConfig of template.exercises) {
        const exerciseId = exerciseMap.get(exConfig.exerciseSlug);
        if (!exerciseId) {
          console.warn(`Exercise slug "${exConfig.exerciseSlug}" not found! Skipping.`);
          continue;
        }

        await db.insert(schema.routineExercises).values({
          routineId,
          exerciseId,
          orderIndex: exConfig.orderIndex,
          targetSets: exConfig.targetSets,
          targetRepsMin: exConfig.targetRepsMin,
          targetRepsMax: exConfig.targetRepsMax,
          targetWeightKg: exConfig.targetWeightKg,
          targetDurationSeconds: exConfig.targetDurationSeconds || null,
          restSeconds: exConfig.restSeconds,
          notes: exConfig.notes || null,
        });
      }
      console.log(`Seeded ${template.exercises.length} exercises for "${template.name}".`);
    }

    console.log("\n[SUCCESS] Phase 6 Workout Templates seeded successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedWorkoutTemplates();

