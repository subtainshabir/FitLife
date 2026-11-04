CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"weight_kg" double precision,
	"height_cm" double precision,
	"body_fat_percentage" double precision,
	"waist_cm" double precision,
	"chest_cm" double precision,
	"hip_cm" double precision,
	"neck_cm" double precision,
	"arm_cm" double precision,
	"forearm_cm" double precision,
	"thigh_cm" double precision,
	"calf_cm" double precision,
	"unit_system" text DEFAULT 'metric' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"milestone_key" text,
	"title_en" text NOT NULL,
	"title_ur" text NOT NULL,
	"description_en" text,
	"description_ur" text,
	"target_value" double precision,
	"current_value" double precision,
	"unit" text,
	"is_achieved" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_type" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transformation_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"photo_date" timestamp with time zone DEFAULT now() NOT NULL,
	"view_angle" text NOT NULL,
	"weight_kg" double precision,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_milestones" ADD CONSTRAINT "progress_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transformation_photos" ADD CONSTRAINT "transformation_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_measurements_user_id_idx" ON "body_measurements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_measurements_recorded_at_idx" ON "body_measurements" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "progress_milestones_user_id_idx" ON "progress_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_milestones_category_idx" ON "progress_milestones" USING btree ("category");--> statement-breakpoint
CREATE INDEX "progress_milestones_is_achieved_idx" ON "progress_milestones" USING btree ("is_achieved");--> statement-breakpoint
CREATE INDEX "progress_reports_user_id_idx" ON "progress_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_reports_created_at_idx" ON "progress_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transformation_photos_user_id_idx" ON "transformation_photos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transformation_photos_photo_date_idx" ON "transformation_photos" USING btree ("photo_date");