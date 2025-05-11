"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getMissions } from "../../../lib/api";
import { Mission } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { handleAbortMission as abortMission } from "../../../lib/api";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Create a client-side only component for the map
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface MissionUpdate {
  type: "mission_update" | "mission_complete" | "connection_test";
  missionId?: number;
  message?: string;
  data?: {
    currentPosition?: { lat: number; lng: number };
    progress?: number;
    distanceCovered?: number;
    remainingDistance?: number;
    estimatedTimeRemaining?: number;
    speed?: number;
    altitude?: number;
    batteryLevel?: number;
    heading?: number;
    timestamp: string;
    status?: string;
    finalPosition?: { lat: number; lng: number };
  };
}

const ReportsPage = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [missionUpdates, setMissionUpdates] = useState<
    Record<string, MissionUpdate["data"]>
  >({});
  const [isConnected, setIsConnected] = useState(false);
  const [selectedMission, setSelectedMission] = useState<number | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);

  const {
    data: missionsData,
    isLoading,
    error,
    refetch,
  } = useQuery<Mission[]>({
    queryKey: ["missions"],
    queryFn: getMissions,
    refetchInterval: 30000,
  });

  const transformMissionUpdate = (
    update: MissionUpdate["data"] | null | undefined
  ) => {
    if (!update || !update.currentPosition) return undefined;
    return {
      currentPosition: update.currentPosition,
      heading: update.heading || 0,
      altitude: update.altitude || 0,
      speed: update.speed || 0,
      batteryLevel: update.batteryLevel || 0,
    } as const;
  };

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket("ws://localhost:5000/ws");

      websocket.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        toast.success("Connected to mission updates");
      };

      websocket.onmessage = (event) => {
        try {
          const data: MissionUpdate = JSON.parse(event.data);
          console.log("Received WebSocket message:", data);

          if (data.type === "connection_test") {
            console.log("Connection test successful:", data.message);
            return;
          }

          if (
            data.type === "mission_update" ||
            data.type === "mission_complete"
          ) {
            const missionId = data.missionId;
            if (!missionId) {
              console.error("Received mission update without missionId:", data);
              return;
            }

            setMissionUpdates((prev) => ({
              ...prev,
              [missionId.toString()]: data.data,
            }));

            if (data.type === "mission_complete") {
              toast.success(`Mission ${missionId} completed!`);
              refetch();
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        toast.error("Lost connection to mission updates");
      };

      websocket.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = websocket;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [refetch]);

  useEffect(() => {
    if (missionsData) {
      setMissions(missionsData);
    }
  }, [missionsData]);

  const handleAbortMission = async (missionId: number) => {
    try {
      const success = await abortMission(missionId);
      if (success) {
        // Close WebSocket connection if it's open
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        // Update mission status in the list
        setMissions((prevMissions) =>
          prevMissions.map((mission) =>
            mission.id === missionId
              ? { ...mission, status: "aborted" as const }
              : mission
          )
        );
        // Close dialog if it's open
        setSelectedMission(null);
      }
    } catch (error) {
      console.error("Error aborting mission:", error);
      toast.error("Failed to abort mission");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold mb-6">Mission Reports</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Mission Reports</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Failed to load missions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMissionData = selectedMission
    ? missions?.find((m) => m.id === selectedMission)
    : null;
  const selectedMissionUpdate = selectedMission
    ? missionUpdates[selectedMission.toString()]
    : null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mission Reports</h1>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {missions?.map((mission) => {
          const update = missionUpdates[mission.id.toString()];
          const isInProgress = mission.status === "in_progress";

          return (
            <Card key={mission.id} className="hover:bg-accent/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Mission #{mission.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Started{" "}
                      {formatDistanceToNow(new Date(mission.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        mission.status === "completed"
                          ? "default"
                          : mission.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {mission.status}
                    </Badge>
                    {isInProgress && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Abort Mission
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Abort Mission #{mission.id}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              immediately stop the drone and return it to its
                              home position.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleAbortMission(mission.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Abort Mission
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMission(mission.id);
                        setIsTrackingDialogOpen(true);
                      }}
                    >
                      View Tracking
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Drone Information</h3>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {mission.drone.name}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {mission.drone.type}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Status:</span>{" "}
                      {mission.drone.droneStatus}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Mission Details</h3>
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Total Distance:
                      </span>{" "}
                      {Number(mission.distance).toFixed(2)} km
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Start:</span>{" "}
                      {mission.startLocation}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Target:</span>{" "}
                      {mission.targetLocation}
                    </p>
                  </div>
                </div>
                {isInProgress && update && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(update.progress || 0) * 100}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Distance Covered
                        </p>
                        <p className="font-medium">
                          {update.distanceCovered} km
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium">
                          {update.remainingDistance} km
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ETA</p>
                        <p className="font-medium">
                          {update.estimatedTimeRemaining} min
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Speed</p>
                        <p className="font-medium">{update.speed} km/min</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Altitude</p>
                        <p className="font-medium">
                          {update.altitude?.toFixed(1)} m
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Battery</p>
                        <p className="font-medium">
                          {update.batteryLevel?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {formatDistanceToNow(new Date(update.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedMission && (
        <Dialog
          open={isTrackingDialogOpen}
          onOpenChange={() => {
            setIsTrackingDialogOpen(false);
            setSelectedMission(null);
          }}
        >
          <DialogContent className="max-w-[85vw] h-[85vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  Mission #{selectedMission} Live Tracking
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="h-[calc(85vh-80px)] w-full">
              <MapComponent
                mission={missions?.find((m) => m.id === selectedMission)!}
                update={selectedMissionUpdate || undefined}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportsPage;
