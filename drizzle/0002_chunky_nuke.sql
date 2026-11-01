CREATE TABLE "food_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"description_en" text,
	"description_ur" text,
	"icon" text DEFAULT 'Apple' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text NOT NULL,
	"description_en" text,
	"description_ur" text,
	"food_type" text DEFAULT 'raw' NOT NULL,
	"default_serving_size" double precision DEFAULT 100 NOT NULL,
	"default_serving_unit" text DEFAULT 'g' NOT NULL,
	"serving_weight_grams" double precision DEFAULT 100 NOT NULL,
	"calories_per_100g" double precision NOT NULL,
	"protein_per_100g" double precision NOT NULL,
	"carbs_per_100g" double precision NOT NULL,
	"fat_per_100g" double precision NOT NULL,
	"fibre_per_100g" double precision DEFAULT 0 NOT NULL,
	"nutrition_source" text NOT NULL,
	"image" text,
	"is_common_pakistani_food" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"language" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"serving_unit_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"country" text DEFAULT 'Pakistan' NOT NULL,
	"province" text NOT NULL,
	"city" text NOT NULL,
	"market_retailer" text NOT NULL,
	"price" double precision NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit" text NOT NULL,
	"price_per_standard_unit" double precision NOT NULL,
	"standard_unit" text DEFAULT 'kg' NOT NULL,
	"currency" text DEFAULT 'PKR' NOT NULL,
	"collection_date" timestamp with time zone DEFAULT now() NOT NULL,
	"source_id" uuid,
	"verification_status" text DEFAULT 'verified' NOT NULL,
	"confidence_level" text DEFAULT 'high' NOT NULL,
	"submitted_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"reference_url" text,
	"reliability_score" double precision DEFAULT 0.95 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_translations" ADD CONSTRAINT "food_translations_food_id_food_items_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_prices" ADD CONSTRAINT "food_prices_food_id_food_items_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_prices" ADD CONSTRAINT "food_prices_source_id_price_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."price_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_prices" ADD CONSTRAINT "food_prices_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "food_categories_slug_idx" ON "food_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "food_items_category_id_idx" ON "food_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "food_items_name_en_idx" ON "food_items" USING btree ("name_en");--> statement-breakpoint
CREATE INDEX "food_items_name_ur_idx" ON "food_items" USING btree ("name_ur");--> statement-breakpoint
CREATE INDEX "food_items_food_type_idx" ON "food_items" USING btree ("food_type");--> statement-breakpoint
CREATE UNIQUE INDEX "food_translations_food_lang_idx" ON "food_translations" USING btree ("food_id","language");--> statement-breakpoint
CREATE INDEX "food_prices_food_id_idx" ON "food_prices" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_prices_city_idx" ON "food_prices" USING btree ("city");--> statement-breakpoint
CREATE INDEX "food_prices_verification_status_idx" ON "food_prices" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "food_prices_city_food_idx" ON "food_prices" USING btree ("city","food_id");--> statement-breakpoint
CREATE INDEX "price_sources_source_type_idx" ON "price_sources" USING btree ("source_type");