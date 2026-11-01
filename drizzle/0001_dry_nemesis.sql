CREATE TABLE "fitness_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_type" text NOT NULL,
	"current_weight" double precision,
	"target_weight" double precision,
	"target_rate" double precision,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"target_date" timestamp with time zone,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"age" integer NOT NULL,
	"gender" text,
	"height" double precision NOT NULL,
	"weight" double precision NOT NULL,
	"activity_level" text NOT NULL,
	"fitness_experience" text,
	"primary_goal" text NOT NULL,
	"bmi" double precision NOT NULL,
	"bmi_category" text NOT NULL,
	"bmr" double precision NOT NULL,
	"tdee" double precision NOT NULL,
	"target_calories" double precision NOT NULL,
	"target_protein_grams" double precision NOT NULL,
	"target_carbs_grams" double precision NOT NULL,
	"target_fat_grams" double precision NOT NULL,
	"is_minor" boolean DEFAULT false NOT NULL,
	"has_health_warning" boolean DEFAULT false NOT NULL,
	"calculation_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"health_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_measurement_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight" double precision NOT NULL,
	"height" double precision,
	"unit" text DEFAULT 'kg' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"notes" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fitness_goals" ADD CONSTRAINT "fitness_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_assessments" ADD CONSTRAINT "body_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurement_history" ADD CONSTRAINT "body_measurement_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fitness_goals_user_id_idx" ON "fitness_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fitness_goals_status_idx" ON "fitness_goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "body_assessments_user_id_idx" ON "body_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_assessments_created_at_idx" ON "body_assessments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "body_measurement_history_user_id_idx" ON "body_measurement_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_measurement_history_recorded_at_idx" ON "body_measurement_history" USING btree ("recorded_at");