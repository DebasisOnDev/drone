CREATE TYPE "public"."drone_status" AS ENUM('available', 'on maintenance', 'unavailable', 'on mission');--> statement-breakpoint
CREATE TYPE "public"."drone_type" AS ENUM('nano', 'micro', 'tactical', 'male', 'hale');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('pending', 'in-progress', 'completed', 'aborted');--> statement-breakpoint
CREATE TYPE "public"."payload_type" AS ENUM('camera', 'thermal sensor', 'lidar', 'radar', 'delivery', 'weaponized');--> statement-breakpoint
CREATE TABLE "drones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"drone_status" "drone_status" DEFAULT 'available' NOT NULL,
	"drone_type" "drone_type" NOT NULL,
	"range_km" integer NOT NULL,
	"total_available" integer DEFAULT 1 NOT NULL,
	"flight_time_min" integer NOT NULL,
	"example_use_case" text NOT NULL,
	"payload_type" "payload_type" NOT NULL,
	"battery_level" integer DEFAULT 100 NOT NULL,
	"image" text,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"drone_id" integer NOT NULL,
	"start_lat" double precision NOT NULL,
	"start_lng" double precision NOT NULL,
	"target_lat" double precision NOT NULL,
	"target_lng" double precision NOT NULL,
	"start_location" text NOT NULL,
	"target_location" text NOT NULL,
	"distance" double precision NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"duration" integer,
	"area_covered" integer,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_drone_id_drones_id_fk" FOREIGN KEY ("drone_id") REFERENCES "public"."drones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;