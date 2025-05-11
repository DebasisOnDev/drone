import { Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { missions, drones } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/drizzle";

let wss: WebSocketServer;
const activeMissions = new Map<number, NodeJS.Timeout>();

export const initializeWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");

    // Send a test message to verify connection
    ws.send(
      JSON.stringify({
        type: "connection_test",
        message: "WebSocket connected successfully",
      })
    );

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("Client disconnected from WebSocket");
    });
  });

  console.log("WebSocket server initialized");
};

const broadcastUpdate = (message: any) => {
  const messageStr = JSON.stringify(message);
  console.log("Broadcasting update:", messageStr);

  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
      clientCount++;
    }
  });
  console.log(`Update sent to ${clientCount} clients`);
};

// Calculate intermediate points for smoother movement
const calculateIntermediatePoints = (
  startLat: number,
  startLng: number,
  targetLat: number,
  targetLng: number,
  steps: number
) => {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    points.push({
      lat: startLat + (targetLat - startLat) * progress,
      lng: startLng + (targetLng - startLng) * progress,
    });
  }
  return points;
};

export const createMission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      droneId,
      startLat,
      startLng,
      targetLat,
      targetLng,
      distance,
      startLocation,
      targetLocation,
    } = req.body;

    // Validate input
    if (
      !droneId ||
      !startLat ||
      !startLng ||
      !targetLat ||
      !targetLng ||
      !distance ||
      !startLocation ||
      !targetLocation
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Check if drone exists and is available
    const drone = await db
      .select()
      .from(drones)
      .where(eq(drones.id, droneId))
      .limit(1);

    if (!drone.length) {
      res.status(404).json({ error: "Drone not found" });
      return;
    }

    if (drone[0].droneStatus !== "available") {
      res.status(400).json({ error: "Drone is not available" });
      return;
    }

    // Create mission
    const newMission = await db
      .insert(missions)
      .values({
        droneId,
        startLat,
        startLng,
        targetLat,
        targetLng,
        distance,
        startLocation,
        targetLocation,
        status: "in_progress",
      })
      .returning();

    console.log("Created new mission:", newMission[0]);

    // Update drone status
    await db
      .update(drones)
      .set({ droneStatus: "on mission" })
      .where(eq(drones.id, droneId));

    // Calculate estimated time based on drone speed (assuming 60 km/h)
    const speedKmPerMin = 1; // 60 km/h = 1 km/min
    const estimatedTimeMinutes = Math.ceil(distance / speedKmPerMin);
    const totalSteps = Math.ceil(estimatedTimeMinutes * 12); // Update every 5 seconds
    const intermediatePoints = calculateIntermediatePoints(
      startLat,
      startLng,
      targetLat,
      targetLng,
      totalSteps
    );

    // Start sending position updates
    const startTime = Date.now();
    let currentStep = 0;

    const interval = setInterval(async () => {
      // Check if mission still exists and is active
      const currentMission = await db
        .select()
        .from(missions)
        .where(eq(missions.id, newMission[0].id))
        .limit(1);

      if (
        !currentMission.length ||
        currentMission[0].status !== "in_progress"
      ) {
        clearInterval(interval);
        activeMissions.delete(newMission[0].id);
        return;
      }

      const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
      const progress = Math.min(elapsedMinutes / estimatedTimeMinutes, 1);
      const currentPoint = intermediatePoints[currentStep];

      // Calculate mission statistics
      const distanceCovered = distance * progress;
      const remainingDistance = distance * (1 - progress);
      const estimatedTimeRemaining = estimatedTimeMinutes * (1 - progress);
      const currentSpeed = speedKmPerMin * (1 + Math.random() * 0.2 - 0.1); // Add slight speed variation

      const updateMessage = {
        type: "mission_update",
        missionId: newMission[0].id,
        data: {
          currentPosition: currentPoint,
          progress,
          distanceCovered: Number(distanceCovered.toFixed(2)),
          remainingDistance: Number(remainingDistance.toFixed(2)),
          estimatedTimeRemaining: Math.ceil(estimatedTimeRemaining),
          speed: Number(currentSpeed.toFixed(2)),
          altitude: 100 + Math.random() * 20, // Simulate altitude variation
          batteryLevel: Math.max(20, 100 - progress * 100), // Simulate battery drain
          heading:
            Math.atan2(
              targetLng - currentPoint.lng,
              targetLat - currentPoint.lat
            ) *
            (180 / Math.PI), // Calculate heading angle
          timestamp: new Date().toISOString(),
        },
      };

      console.log("Sending mission update:", updateMessage);
      broadcastUpdate(updateMessage);

      currentStep++;

      // Check if mission is complete
      if (progress >= 1 || distanceCovered >= distance) {
        clearInterval(interval);
        activeMissions.delete(newMission[0].id);

        // Update mission and drone status
        await db
          .update(missions)
          .set({ status: "completed" })
          .where(eq(missions.id, newMission[0].id));
        await db
          .update(drones)
          .set({ droneStatus: "available" })
          .where(eq(drones.id, droneId));

        // Send final update
        const finalUpdate = {
          type: "mission_complete",
          missionId: newMission[0].id,
          data: {
            status: "completed",
            finalPosition: { lat: targetLat, lng: targetLng },
            timestamp: new Date().toISOString(),
          },
        };
        console.log("Sending mission complete update:", finalUpdate);
        broadcastUpdate(finalUpdate);
      }
    }, 5000); // Update every 5 seconds

    // Store the interval for cleanup
    activeMissions.set(newMission[0].id, interval);

    res.status(201).json({ success: true, data: newMission[0] });
  } catch (error) {
    console.error("Mission creation error:", error);
    res.status(500).json({ error: "Failed to create mission" });
  }
};

export const updateMissionStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedMission = await db
      .update(missions)
      .set({ status, updatedAt: new Date() })
      .where(eq(missions.id, parseInt(id)))
      .returning();

    if (!updatedMission.length) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    res.json(updatedMission[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update mission status" });
  }
};

export const getMissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allMissions = await db
      .select()
      .from(missions)
      .leftJoin(drones, eq(missions.droneId, drones.id));

    const formattedMissions = allMissions.map((mission: any) => ({
      ...mission.missions,
      drone: mission.drones,
      distance: Number(mission.missions.distance),
      startLat: Number(mission.missions.startLat),
      startLng: Number(mission.missions.startLng),
      targetLat: Number(mission.missions.targetLat),
      targetLng: Number(mission.missions.targetLng),
    }));

    res.json(formattedMissions);
  } catch (error) {
    console.error("Error fetching missions:", error);
    res.status(500).json({ error: "Failed to fetch missions" });
  }
};

export const abortMission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const missionId = parseInt(id);

    // Find the mission
    const mission = await db
      .select()
      .from(missions)
      .where(eq(missions.id, missionId))
      .limit(1);

    if (!mission.length) {
      return res.status(404).json({ error: "Mission not found" });
    }

    if (mission[0].status === "completed" || mission[0].status === "aborted") {
      return res
        .status(400)
        .json({ error: "Mission is already completed or aborted" });
    }

    // Clear the interval if it exists
    const interval = activeMissions.get(missionId);
    if (interval) {
      clearInterval(interval);
      activeMissions.delete(missionId);
    }

    // Update mission status to aborted
    const updatedMission = await db
      .update(missions)
      .set({
        status: "aborted",
        updatedAt: new Date(),
      })
      .where(eq(missions.id, missionId))
      .returning();

    // Update drone status to available
    if (mission[0].droneId) {
      await db
        .update(drones)
        .set({
          droneStatus: "available",
        })
        .where(eq(drones.id, mission[0].droneId));
    }

    // Send abort notification to connected clients
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "mission_complete",
              missionId: missionId,
              message: "Mission aborted",
              data: {
                status: "aborted",
                timestamp: new Date().toISOString(),
              },
            })
          );
        }
      });
    }

    res.json(updatedMission[0]);
  } catch (error) {
    console.error("Error aborting mission:", error);
    res.status(500).json({ error: "Failed to abort mission" });
  }
};
