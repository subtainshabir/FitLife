CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"record_type" text NOT NULL,
	"value" double precision NOT NULL,
	"previous_value" double precision,
	"session_id" uuid,
	"achieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"target_sets" integer DEFAULT 3 NOT NULL,
	"target_reps_min" integer DEFAULT 8 NOT NULL,
	"target_reps_max" integer DEFAULT 12 NOT NULL,
	"target_weight_kg" double precision DEFAULT 0 NOT NULL,
	"target_duration_seconds" integer,
	"rest_seconds" integer DEFAULT 60 NOT NULL,
	"notes" text,
	"notes_ur" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_skipped" boolean DEFAULT false NOT NULL,
	"replaced_with_exercise_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"is_warmup" boolean DEFAULT false NOT NULL,
	"weight_kg" double precision DEFAULT 0 NOT NULL,
	"reps_completed" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"rpe" double precision,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"name_ur" text,
	"description" text,
	"description_ur" text,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"target_duration_minutes" integer DEFAULT 45 NOT NULL,
	"split_type" text DEFAULT 'full_body' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"day_of_week" integer NOT NULL,
	"is_rest_day" boolean DEFAULT false NOT NULL,
	"scheduled_time" text DEFAULT '08:00' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"name" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"total_volume_kg" double precision DEFAULT 0 NOT NULL,
	"total_sets_completed" integer DEFAULT 0 NOT NULL,
	"total_reps_completed" integer DEFAULT 0 NOT NULL,
	"estimated_calories_burned" double precision DEFAULT 0 NOT NULL,
	"rating" integer,
	"perceived_exertion_rpe" double precision,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_workout_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_replaced_with_exercise_id_exercises_id_fk" FOREIGN KEY ("replaced_with_exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_schedules" ADD CONSTRAINT "workout_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_schedules" ADD CONSTRAINT "workout_schedules_routine_id_workout_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_workout_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personal_records_user_exercise_idx" ON "personal_records" USING btree ("user_id","exercise_id");--> statement-breakpoint
CREATE INDEX "personal_records_record_type_idx" ON "personal_records" USING btree ("record_type");--> statement-breakpoint
CREATE INDEX "routine_exercises_routine_id_idx" ON "routine_exercises" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "routine_exercises_exercise_id_idx" ON "routine_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "routine_exercises_order_idx" ON "routine_exercises" USING btree ("routine_id","order_index");--> statement-breakpoint
CREATE INDEX "session_exercises_session_id_idx" ON "session_exercises" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_exercises_exercise_id_idx" ON "session_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "session_sets_session_exercise_id_idx" ON "session_sets" USING btree ("session_exercise_id");--> statement-breakpoint
CREATE INDEX "workout_routines_user_id_idx" ON "workout_routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_routines_is_template_idx" ON "workout_routines" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "workout_routines_split_type_idx" ON "workout_routines" USING btree ("split_type");--> statement-breakpoint
CREATE INDEX "workout_routines_difficulty_idx" ON "workout_routines" USING btree ("difficulty");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_schedules_user_day_idx" ON "workout_schedules" USING btree ("user_id","day_of_week");--> statement-breakpoint
CREATE INDEX "workout_schedules_user_id_idx" ON "workout_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_id_idx" ON "workout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_status_idx" ON "workout_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workout_sessions_start_time_idx" ON "workout_sessions" USING btree ("start_time");