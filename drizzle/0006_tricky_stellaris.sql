CREATE TABLE "daily_food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" text NOT NULL,
	"target_calories" double precision DEFAULT 2000 NOT NULL,
	"target_protein_grams" double precision DEFAULT 120 NOT NULL,
	"target_carbs_grams" double precision DEFAULT 250 NOT NULL,
	"target_fat_grams" double precision DEFAULT 65 NOT NULL,
	"target_fibre_grams" double precision DEFAULT 30 NOT NULL,
	"total_calories" double precision DEFAULT 0 NOT NULL,
	"total_protein_grams" double precision DEFAULT 0 NOT NULL,
	"total_carbs_grams" double precision DEFAULT 0 NOT NULL,
	"total_fat_grams" double precision DEFAULT 0 NOT NULL,
	"total_fibre_grams" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favourite_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_item_id" uuid NOT NULL,
	"custom_serving_size" double precision,
	"custom_serving_unit" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_log_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"food_item_id" uuid,
	"meal_category" text NOT NULL,
	"food_name_en" text NOT NULL,
	"food_name_ur" text,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"weight_grams" double precision NOT NULL,
	"calories" double precision NOT NULL,
	"protein_grams" double precision NOT NULL,
	"carbs_grams" double precision NOT NULL,
	"fat_grams" double precision NOT NULL,
	"fibre_grams" double precision DEFAULT 0 NOT NULL,
	"planned_meal_food_item_id" uuid,
	"is_from_meal_plan" boolean DEFAULT false NOT NULL,
	"idempotency_key" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_ur" text,
	"meal_category" text DEFAULT 'lunch' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_calories" double precision DEFAULT 0 NOT NULL,
	"total_protein_grams" double precision DEFAULT 0 NOT NULL,
	"total_carbs_grams" double precision DEFAULT 0 NOT NULL,
	"total_fat_grams" double precision DEFAULT 0 NOT NULL,
	"total_fibre_grams" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_water_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_target_ml" integer DEFAULT 2500 NOT NULL,
	"container_size_ml" integer DEFAULT 250 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_water_goals_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "water_intake_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" text NOT NULL,
	"amount_ml" integer NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_food_logs" ADD CONSTRAINT "daily_food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_foods" ADD CONSTRAINT "favourite_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_foods" ADD CONSTRAINT "favourite_foods_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_entries" ADD CONSTRAINT "food_log_entries_daily_log_id_daily_food_logs_id_fk" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_food_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_entries" ADD CONSTRAINT "food_log_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_entries" ADD CONSTRAINT "food_log_entries_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_entries" ADD CONSTRAINT "food_log_entries_planned_meal_food_item_id_meal_food_items_id_fk" FOREIGN KEY ("planned_meal_food_item_id") REFERENCES "public"."meal_food_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meals" ADD CONSTRAINT "saved_meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_water_goals" ADD CONSTRAINT "user_water_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_intake_entries" ADD CONSTRAINT "water_intake_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_food_logs_user_date_idx" ON "daily_food_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "daily_food_logs_user_id_idx" ON "daily_food_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_food_logs_log_date_idx" ON "daily_food_logs" USING btree ("log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "favourite_foods_user_food_idx" ON "favourite_foods" USING btree ("user_id","food_item_id");--> statement-breakpoint
CREATE INDEX "favourite_foods_user_id_idx" ON "favourite_foods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_log_entries_daily_log_id_idx" ON "food_log_entries" USING btree ("daily_log_id");--> statement-breakpoint
CREATE INDEX "food_log_entries_user_id_idx" ON "food_log_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_log_entries_meal_category_idx" ON "food_log_entries" USING btree ("meal_category");--> statement-breakpoint
CREATE INDEX "food_log_entries_idempotency_key_idx" ON "food_log_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "saved_meals_user_id_idx" ON "saved_meals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_water_goals_user_id_idx" ON "user_water_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "water_intake_user_date_idx" ON "water_intake_entries" USING btree ("user_id","log_date");