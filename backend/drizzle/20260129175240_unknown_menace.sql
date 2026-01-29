-- Drop foreign key constraints before altering column types
ALTER TABLE "location_updates" DROP CONSTRAINT "location_updates_driver_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "maintenance_logs" DROP CONSTRAINT "maintenance_logs_performed_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_driver_id_users_id_fk";--> statement-breakpoint

-- Alter column types
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "driver_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "location_updates" ALTER COLUMN "driver_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ALTER COLUMN "performed_by" SET DATA TYPE text;--> statement-breakpoint

-- Recreate foreign key constraints
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;