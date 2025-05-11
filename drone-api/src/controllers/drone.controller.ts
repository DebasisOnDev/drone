import { Request, Response } from "express";
import { drones } from "../db/schema";
import { eq, gte } from "drizzle-orm";
import db from "../db/drizzle";

export const getDronesWithAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const droneData = await db.select().from(drones);
    console.log(droneData);
    res.status(200).json(droneData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch drones" });
  }
};

export const getDroneById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: idParam } = req.params; // idParam is a string
    const numericId = parseInt(idParam, 10); // Always use radix 10 with parseInt

    // Validate if parseInt resulted in a valid number
    if (isNaN(numericId)) {
      res
        .status(400)
        .json({ error: "Invalid drone ID format. ID must be an integer." });
      return;
    }
    const drone = await db
      .select()
      .from(drones)
      .where(eq(drones.id, numericId))
      .limit(1);

    if (!drone.length) {
      res.status(404).json({ error: "Drone not found" });
      return;
    }

    res.json(drone[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch drone details" });
  }
};

export const getDronesByRange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const range = Number(req.query.range);

    if (isNaN(range)) {
      res.status(400).json({ error: "Invalid range parameter" });
      return;
    }

    const compatibleDrones = await db
      .select()
      .from(drones)
      .where(gte(drones.rangeKm, Math.ceil(range)))
      .orderBy(drones.rangeKm);

    res.json(compatibleDrones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch compatible drones" });
  }
};

export const createDrone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      type,
      rangeKm,
      totalAvailable,
      flightTimeMin,
      exampleUseCase,
      payloadType,
      image,
    } = req.body;

    const newDrone = await db
      .insert(drones)
      .values({
        name,
        type,
        rangeKm,
        totalAvailable,
        flightTimeMin,
        exampleUseCase,
        payloadType,
        image,
        droneStatus: "available",
        batteryLevel: 100,
      })
      .returning();

    res.status(201).json({ success: true, data: newDrone[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to create drone" });
  }
};
