-- Create users table
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text UNIQUE,
	"phone" text UNIQUE,
	"password" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Create vehicles table
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"immatriculation" text NOT NULL,
	"marque" text NOT NULL,
	"modele" text NOT NULL,
	"carburant" text NOT NULL,
	"dimensions_roues" text NOT NULL,
	"roue_secours" boolean NOT NULL DEFAULT true,
	"cric" boolean NOT NULL DEFAULT true,
	"croix" boolean NOT NULL DEFAULT true,
	"extincteur" boolean NOT NULL DEFAULT true,
	"trousse_secours" boolean NOT NULL DEFAULT true,
	"carte_recharge" boolean NOT NULL DEFAULT true,
	"numero_carte_recharge" text,
	"created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Create shifts table
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" text NOT NULL,
	"vehicle_id" uuid,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL DEFAULT 'active',
	"start_battery_count" integer,
	"end_battery_count" integer,
	"created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Create inspections table
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"type" text NOT NULL,
	"video_url" text,
	"trousse_secours" boolean NOT NULL,
	"trousse_secours_photo" text,
	"trousse_secours_comment" text,
	"roue_secours" boolean NOT NULL,
	"roue_secours_photo" text,
	"roue_secours_comment" text,
	"extincteur" boolean NOT NULL,
	"extincteur_photo" text,
	"extincteur_comment" text,
	"booster_batterie" boolean NOT NULL,
	"booster_batterie_photo" text,
	"booster_batterie_comment" text,
	"completed_at" timestamp
);--> statement-breakpoint

-- Create battery_records table
CREATE TABLE "battery_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"type" text NOT NULL,
	"count" integer NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text NOT NULL,
	"driver_signature" text,
	"team_leader_signature" text,
	"created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Create location_updates table
CREATE TABLE "location_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"driver_id" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"accuracy" text,
	"timestamp" timestamp NOT NULL
);--> statement-breakpoint

-- Create maintenance_logs table
CREATE TABLE "maintenance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"description" text NOT NULL,
	"performed_by" text NOT NULL,
	"performed_at" timestamp NOT NULL,
	"cost" text,
	"notes" text
);--> statement-breakpoint

-- Create alerts table
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb,
	"user_id" text,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"read_at" timestamp
);--> statement-breakpoint

-- Create maintenance_alerts table
CREATE TABLE "maintenance_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"threshold_km" integer NOT NULL,
	"current_km" integer NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"resolved_at" timestamp
);--> statement-breakpoint

-- Add foreign keys
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battery_records" ADD CONSTRAINT "battery_records_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_alerts" ADD CONSTRAINT "maintenance_alerts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Create indexes
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "shifts_driver_id_idx" ON "shifts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "shifts_vehicle_id_idx" ON "shifts" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "shifts_status_idx" ON "shifts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inspections_shift_id_idx" ON "inspections" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "battery_records_shift_id_idx" ON "battery_records" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "location_updates_shift_id_idx" ON "location_updates" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "location_updates_driver_id_idx" ON "location_updates" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "location_updates_timestamp_idx" ON "location_updates" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "maintenance_logs_vehicle_id_idx" ON "maintenance_logs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "maintenance_logs_performed_at_idx" ON "maintenance_logs" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "alerts_type_idx" ON "alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alerts_user_id_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alerts_created_at_idx" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alerts_read_at_idx" ON "alerts" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "maintenance_alerts_vehicle_id_idx" ON "maintenance_alerts" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "maintenance_alerts_alert_type_idx" ON "maintenance_alerts" USING btree ("alert_type");
