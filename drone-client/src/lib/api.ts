import { toast } from "sonner";
import { Drone, DroneType, Mission, PayloadType } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type CreateDroneInput = {
  name: string;
  type: DroneType;
  rangeKm: number;
  totalAvailable: number;
  flightTimeMin: number;
  exampleUseCase: string;
  payloadType: PayloadType;
  image?: string;
};

export const getDronesWithAvailability = async (): Promise<Drone[]> => {
  const response = await fetch(`${API_BASE_URL}/drones`);
  if (!response.ok) {
    throw new Error("Failed to fetch drones");
  }
  return response.json();
};

export const getDroneById = async (id: number): Promise<Drone | null> => {
  if (!id || isNaN(id)) {
    return null;
  }
  const response = await fetch(`${API_BASE_URL}/drones/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch drone details");
  }
  return response.json();
};

export const getDronesByRange = async (range: number): Promise<Drone[]> => {
  if (!range || isNaN(range) || range < 0) {
    return [];
  }
  const response = await fetch(`${API_BASE_URL}/drones/range?range=${range}`);
  if (!response.ok) {
    throw new Error("Failed to fetch compatible drones");
  }
  return response.json();
};

export const createDrone = async (
  data: CreateDroneInput
): Promise<{ success: boolean; data: Drone }> => {
  const response = await fetch(`${API_BASE_URL}/drones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create drone");
  }

  return response.json();
};

export const getMissions = async (): Promise<Mission[]> => {
  const response = await fetch(`${API_BASE_URL}/missions`);
  if (!response.ok) {
    throw new Error("Failed to fetch missions");
  }
  return response.json();
};

export const handleAbortMission = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/missions/${id}/abort`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to abort mission");
    }

    toast.success("Mission aborted successfully");
    return true;
  } catch (error) {
    console.error("Error aborting mission:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to abort mission"
    );
    return false;
  }
};
