import db from "../drizzle";
import { drones } from "../schema";
import droneData from "../seeds/data/drones.json";
import { InferInsertModel } from "drizzle-orm";

type DroneInsert = InferInsertModel<typeof drones>;

export default async function seedDrones(drizzle: db) {
  try {
    console.log("Seeding drones...");
    await drizzle.insert(drones).values(droneData as DroneInsert[]);
    console.log("Drones seeded successfully!");
  } catch (error) {
    console.error("Error seeding drones:", error);
    throw error;
  }
}
