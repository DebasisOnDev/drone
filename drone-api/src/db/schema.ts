import {
  pgTable,
  serial,
  varchar,
  integer,
  jsonb,
  timestamp,
  text,
  pgEnum,
  numeric,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const droneStatusEnum = pgEnum("drone_status", [
  "available",
  "on maintenance",
  "unavailable",
  "on mission",
]);

export const droneTypeEnum = pgEnum("drone_type", [
  "nano",
  "micro",
  "tactical",
  "male", // Medium Altitude Long Endurance
  "hale", // High Altitude Long Endurance
]);

export const payloadTypeEnum = pgEnum("payload_type", [
  "camera",
  "thermal sensor",
  "lidar",
  "radar",
  "delivery",
  "weaponized",
]);

export const missionStatusEnum = pgEnum("mission_status", [
  "pending",
  "in-progress",
  "completed",
  "aborted",
]);

export const drones = pgTable("drones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  droneStatus: droneStatusEnum("drone_status").notNull().default("available"),
  type: droneTypeEnum("drone_type").notNull(),
  rangeKm: integer("range_km").notNull(),
  totalAvailable: integer("total_available").notNull().default(1),
  flightTimeMin: integer("flight_time_min").notNull(),
  exampleUseCase: text("example_use_case").notNull(),
  payloadType: payloadTypeEnum("payload_type").notNull(),
  batteryLevel: integer("battery_level").notNull().default(100),
  image: text("image"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  droneId: integer("drone_id")
    .notNull()
    .references(() => drones.id),
  startLat: doublePrecision("start_lat").notNull(),
  startLng: doublePrecision("start_lng").notNull(),
  targetLat: doublePrecision("target_lat").notNull(),
  targetLng: doublePrecision("target_lng").notNull(),
  startLocation: text("start_location").notNull(),
  targetLocation: text("target_location").notNull(),
  distance: doublePrecision("distance").notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "failed", "aborted"],
  }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id")
    .notNull()
    .references(() => missions.id, { onDelete: "cascade" }),
  duration: integer("duration"),
  areaCovered: integer("area_covered"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dronesRelations = relations(drones, ({ many }) => ({
  missions: many(missions),
}));

export const missionsRelations = relations(missions, ({ one }) => ({
  drone: one(drones, {
    fields: [missions.droneId],
    references: [drones.id],
  }),
  report: one(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  mission: one(missions, {
    fields: [reports.missionId],
    references: [missions.id],
  }),
}));
