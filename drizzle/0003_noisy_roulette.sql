CREATE TABLE "food_substitutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"original_food_item_id" uuid,
	"substitute_food_item_id" uuid,
	"original_name_en" text NOT NULL,
	"substitute_name_en" text NOT NULL,
	"reason" text,
	"calorie_delta" double precision DEFAULT 0 NOT NULL,
	"protein_delta" double precision DEFAULT 0 NOT NULL,
	"cost_delta_pkr" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grocery_list_id" uuid NOT NULL,
	"food_item_id" uuid,
	"item_name_en" text NOT NULL,
	"item_name_ur" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"total_quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"estimated_cost_pkr" double precision DEFAULT 0 NOT NULL,
	"is_purchased" boolean DEFAULT false NOT NULL,
	"price_source" text,
	"is_verified_price" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrition_plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"days_covered" integer DEFAULT 7 NOT NULL,
	"total_estimated_cost_pkr" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_item_id" uuid,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"weight_grams" double precision NOT NULL,
	"calories" double precision NOT NULL,
	"protein_grams" double precision NOT NULL,
	"carbs_grams" double precision NOT NULL,
	"fat_grams" double precision NOT NULL,
	"fibre_grams" double precision DEFAULT 0 NOT NULL,
	"cost_pkr" double precision DEFAULT 0 NOT NULL,
	"price_source" text,
	"is_verified_price" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrition_plan_id" uuid NOT NULL,
	"day_number" integer DEFAULT 1 NOT NULL,
	"day_name" text DEFAULT 'Daily Routine' NOT NULL,
	"total_calories" double precision DEFAULT 0 NOT NULL,
	"total_protein_grams" double precision DEFAULT 0 NOT NULL,
	"total_carbs_grams" double precision DEFAULT 0 NOT NULL,
	"total_fat_grams" double precision DEFAULT 0 NOT NULL,
	"total_fibre_grams" double precision DEFAULT 0 NOT NULL,
	"total_cost_pkr" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_plan_id" uuid NOT NULL,
	"meal_type" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"prep_time_minutes" integer DEFAULT 15 NOT NULL,
	"instructions" text,
	"target_calories" double precision,
	"total_calories" double precision DEFAULT 0 NOT NULL,
	"total_protein_grams" double precision DEFAULT 0 NOT NULL,
	"total_carbs_grams" double precision DEFAULT 0 NOT NULL,
	"total_fat_grams" double precision DEFAULT 0 NOT NULL,
	"total_fibre_grams" double precision DEFAULT 0 NOT NULL,
	"total_cost_pkr" double precision DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text NOT NULL,
	"target_calories" double precision NOT NULL,
	"target_protein_grams" double precision NOT NULL,
	"target_carbs_grams" double precision NOT NULL,
	"target_fat_grams" double precision NOT NULL,
	"target_fibre_grams" double precision DEFAULT 25 NOT NULL,
	"daily_budget" double precision NOT NULL,
	"budget_period" text DEFAULT 'daily' NOT NULL,
	"currency" text DEFAULT 'PKR' NOT NULL,
	"city" text DEFAULT 'Rawalpindi' NOT NULL,
	"meals_per_day" integer DEFAULT 4 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_calories" double precision DEFAULT 0 NOT NULL,
	"total_protein_grams" double precision DEFAULT 0 NOT NULL,
	"total_carbs_grams" double precision DEFAULT 0 NOT NULL,
	"total_fat_grams" double precision DEFAULT 0 NOT NULL,
	"total_fibre_grams" double precision DEFAULT 0 NOT NULL,
	"total_daily_cost_pkr" double precision DEFAULT 0 NOT NULL,
	"is_budget_exceeded" boolean DEFAULT false NOT NULL,
	"ai_notes" text,
	"ai_model" text DEFAULT 'deterministic_engine',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_nutrition_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_budget" double precision DEFAULT 500 NOT NULL,
	"budget_period" text DEFAULT 'daily' NOT NULL,
	"currency" text DEFAULT 'PKR' NOT NULL,
	"city" text DEFAULT 'Rawalpindi' NOT NULL,
	"meals_per_day" integer DEFAULT 4 NOT NULL,
	"cooking_time_minutes" integer DEFAULT 30 NOT NULL,
	"dietary_type" text DEFAULT 'standard' NOT NULL,
	"preferred_foods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_foods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allergies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dietary_restrictions" jsonb DEFAULT '["halal"]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_nutrition_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "food_substitutions" ADD CONSTRAINT "food_substitutions_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_substitutions" ADD CONSTRAINT "food_substitutions_original_food_item_id_food_items_id_fk" FOREIGN KEY ("original_food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_substitutions" ADD CONSTRAINT "food_substitutions_substitute_food_item_id_food_items_id_fk" FOREIGN KEY ("substitute_food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_grocery_list_id_grocery_lists_id_fk" FOREIGN KEY ("grocery_list_id") REFERENCES "public"."grocery_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_nutrition_plan_id_nutrition_plans_id_fk" FOREIGN KEY ("nutrition_plan_id") REFERENCES "public"."nutrition_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_food_items" ADD CONSTRAINT "meal_food_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_food_items" ADD CONSTRAINT "meal_food_items_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_nutrition_plan_id_nutrition_plans_id_fk" FOREIGN KEY ("nutrition_plan_id") REFERENCES "public"."nutrition_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_nutrition_preferences" ADD CONSTRAINT "user_nutrition_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_substitutions_meal_id_idx" ON "food_substitutions" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "grocery_list_items_list_id_idx" ON "grocery_list_items" USING btree ("grocery_list_id");--> statement-breakpoint
CREATE INDEX "grocery_lists_plan_id_idx" ON "grocery_lists" USING btree ("nutrition_plan_id");--> statement-breakpoint
CREATE INDEX "grocery_lists_user_id_idx" ON "grocery_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meal_food_items_meal_id_idx" ON "meal_food_items" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_food_items_food_item_id_idx" ON "meal_food_items" USING btree ("food_item_id");--> statement-breakpoint
CREATE INDEX "meal_plans_plan_id_idx" ON "meal_plans" USING btree ("nutrition_plan_id");--> statement-breakpoint
CREATE INDEX "meals_meal_plan_id_idx" ON "meals" USING btree ("meal_plan_id");--> statement-breakpoint
CREATE INDEX "meals_meal_type_idx" ON "meals" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "nutrition_plans_user_id_idx" ON "nutrition_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nutrition_plans_status_idx" ON "nutrition_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nutrition_plans_created_at_idx" ON "nutrition_plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_nutrition_pref_user_id_idx" ON "user_nutrition_preferences" USING btree ("user_id");