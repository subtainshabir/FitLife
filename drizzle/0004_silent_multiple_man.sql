CREATE TABLE "exercise_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"description_en" text,
	"description_ur" text,
	"icon" text DEFAULT 'Dumbbell' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"slug" text NOT NULL,
	"description_en" text NOT NULL,
	"description_ur" text NOT NULL,
	"primary_muscle_id" uuid NOT NULL,
	"primary_muscle" text NOT NULL,
	"secondary_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"training_type" text NOT NULL,
	"exercise_type" text DEFAULT 'compound' NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"equipment" text DEFAULT 'none' NOT NULL,
	"movement_pattern" text DEFAULT 'push' NOT NULL,
	"is_bodyweight" boolean DEFAULT false NOT NULL,
	"starting_position_en" text NOT NULL,
	"starting_position_ur" text NOT NULL,
	"execution_steps_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"execution_steps_ur" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"breathing_pattern_en" text NOT NULL,
	"breathing_pattern_ur" text NOT NULL,
	"safety_precautions_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety_precautions_ur" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_mistakes_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_mistakes_ur" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"easier_variation" text,
	"harder_variation" text,
	"alternative_exercise_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_met_value" double precision,
	"estimated_calories_per_minute" double precision,
	"demo_media_url" text,
	"thumbnail_url" text,
	"media_type" text DEFAULT 'illustration' NOT NULL,
	"media_attribution" text DEFAULT 'FitLife AI Anatomical Motion Guide',
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "muscle_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"body_region" text NOT NULL,
	"view" text NOT NULL,
	"description_en" text,
	"description_ur" text,
	"function_en" text,
	"function_ur" text,
	"svg_id" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "muscle_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_exercise_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."exercise_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_primary_muscle_id_muscle_groups_id_fk" FOREIGN KEY ("primary_muscle_id") REFERENCES "public"."muscle_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_categories_slug_idx" ON "exercise_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_slug_idx" ON "exercises" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "exercises_category_idx" ON "exercises" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "exercises_primary_muscle_idx" ON "exercises" USING btree ("primary_muscle");--> statement-breakpoint
CREATE INDEX "exercises_training_type_idx" ON "exercises" USING btree ("training_type");--> statement-breakpoint
CREATE INDEX "exercises_difficulty_idx" ON "exercises" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "exercises_equipment_idx" ON "exercises" USING btree ("equipment");--> statement-breakpoint
CREATE UNIQUE INDEX "muscle_groups_slug_idx" ON "muscle_groups" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "muscle_groups_body_region_idx" ON "muscle_groups" USING btree ("body_region");