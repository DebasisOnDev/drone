export const droneTypeEnum = {
  enumValues: ["nano", "micro", "small", "medium", "large"] as const,
} as const;

export const payloadTypeEnum = {
  enumValues: ["camera", "sensor", "delivery", "medical"] as const,
} as const;

export const droneStatusEnum = {
  enumValues: ["available", "on mission", "maintenance"] as const,
} as const;

export type DroneType = (typeof droneTypeEnum.enumValues)[number];
export type PayloadType = (typeof payloadTypeEnum.enumValues)[number];
export type DroneStatus = (typeof droneStatusEnum.enumValues)[number];

export interface Drone {
  id: number;
  name: string;
  type: DroneType;
  rangeKm: number;
  totalAvailable: number;
  flightTimeMin: number;
  exampleUseCase: string;
  payloadType: PayloadType;
  image?: string;
  droneStatus: DroneStatus;
  batteryLevel: number;
}

export type Location = {
  lat: number;
  lng: number;
  name: string;
};

export type Mission = {
  id: number;
  droneId: number;
  drone: Drone;
  startLat: number;
  startLng: number;
  targetLat: number;
  targetLng: number;
  distance: number;
  startLocation: string;
  targetLocation: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "aborted";
  createdAt: string;
  updatedAt: string;
};
