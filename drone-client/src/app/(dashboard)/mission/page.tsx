"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDroneById, getDronesByRange } from "@/lib/api";
import { Drone } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css"; // Keep CSS import or move to Map component / global styles
import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("@/components/Map"), { ssr: false });

type Location = {
  lat: number;
  lng: number;
  name: string;
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MissionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const droneIdParam = searchParams.get("droneId");
  const droneId =
    droneIdParam && !isNaN(parseInt(droneIdParam))
      ? parseInt(droneIdParam)
      : null;

  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [clickMode, setClickMode] = useState<"start" | "end" | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Location | null>(null);
  const [missionProgress, setMissionProgress] = useState<number>(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const {
    data: drone,
    isLoading,
    isError,
    error,
  } = useQuery<Drone | null>({
    queryKey: ["drone", droneId],
    queryFn: () => (droneId ? getDroneById(droneId) : Promise.resolve(null)),
    enabled: !!droneId,
  });

  const { data: compatibleDrones } = useQuery<Drone[]>({
    queryKey: ["compatibleDrones", distance],
    queryFn: () => getDronesByRange(Math.ceil(distance!) || 0),
    enabled: !!distance,
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket("ws://localhost:5000/ws");

    websocket.onopen = () => {
      console.log("WebSocket connected");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "position_update") {
          setCurrentPosition({
            lat: data.data.lat,
            lng: data.data.lng,
            name: "Current Position",
          });
          setMissionProgress(data.data.progress);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error. Please try again.");
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (
      distance &&
      drone &&
      distance > drone.rangeKm &&
      compatibleDrones &&
      compatibleDrones.length > 0
    ) {
      const bestDrone = compatibleDrones[0];
      router.push(`/mission?droneId=${bestDrone.id}`);
      toast.info(
        `Switched to ${bestDrone.name} with ${bestDrone.rangeKm}km range`
      );
    }
  }, [distance, drone, compatibleDrones, router]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!clickMode) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      const location = {
        lat,
        lng,
        name: data.display_name,
      };

      if (clickMode === "start") {
        setStartLocation(location);
        setClickMode("end");
      } else {
        setEndLocation(location);
        setClickMode(null);
      }

      if (clickMode === "end" && startLocation) {
        const newDistance = calculateDistance(
          startLocation.lat,
          startLocation.lng,
          lat,
          lng
        );
        setDistance(newDistance);
      }
    } catch (error) {
      console.error("Error getting location name:", error);
    }
  };

  const handleRefresh = () => {
    setStartLocation(null);
    setEndLocation(null);
    setDistance(null);
    setClickMode(null);
    setMapKey((prev) => prev + 1);
    toast.success("Locations cleared");
  };

  const handleStartClick = () => {
    setClickMode("start");
    toast.info("Click on the map to set start location");
  };

  const handleEndClick = () => {
    if (!startLocation) {
      toast.error("Please set start location first");
      return;
    }
    setClickMode("end");
    toast.info("Click on the map to set target location");
  };

  const handleDroneChange = (id: string) => {
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      router.push(`/mission?droneId=${numericId}`);
    } else {
      toast.error("Invalid drone ID selected");
    }
  };

  const handleSubmit = async () => {
    if (startLocation && endLocation && drone) {
      if (distance && distance > drone.rangeKm) {
        toast.error("Selected drone's range is insufficient for this mission");
        return;
      }
      setIsSubmitting(true);

      try {
        const response = await fetch("http://localhost:5000/api/v1/missions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            droneId: drone.id,
            startLat: startLocation.lat,
            startLng: startLocation.lng,
            targetLat: endLocation.lat,
            targetLng: endLocation.lng,
            distance: distance,
            startLocation: startLocation.name,
            targetLocation: endLocation.name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create mission");
        }

        const data = await response.json();
        toast.success("Mission planned successfully!");
      } catch (error) {
        console.error("Mission creation error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to plan mission"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!droneId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">No Drone Selected</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Please select a drone from the fleet to start mission planning.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="absolute top-4 right-4 z-50">
          <Card className="w-[350px]">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        </div>
        <div className="h-[calc(100vh-3rem)]">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Error</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!drone) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Drone Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <div className="absolute top-4 right-4 z-[500]">
        <Card className="w-[350px]">
          <CardContent className="px-4 py-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{drone.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {drone.type.toUpperCase()}
                </p>
              </div>
              <Badge
                variant={
                  drone.droneStatus === "available"
                    ? "secondary"
                    : drone.droneStatus === "on mission"
                    ? "outline"
                    : "destructive"
                }
              >
                {drone.droneStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Range:</span>
                <span className="ml-1 font-medium">{drone.rangeKm} km</span>
              </div>
              <div>
                <span className="text-muted-foreground">Flight Time:</span>
                <span className="ml-1 font-medium">
                  {drone.flightTimeMin} min
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Payload:</span>
                <span className="ml-1 font-medium capitalize">
                  {drone.payloadType}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="w-10 p-0"
                >
                  ↻
                </Button>
                <Button
                  variant={clickMode === "start" ? "default" : "outline"}
                  onClick={handleStartClick}
                  className="flex-1"
                >
                  Set Start
                </Button>
                <Button
                  variant={clickMode === "end" ? "default" : "outline"}
                  onClick={handleEndClick}
                  className="flex-1"
                >
                  Set Target
                </Button>
              </div>

              {startLocation && (
                <div>
                  <p className="text-sm font-medium">Start Location</p>
                  <p className="text-xs text-muted-foreground">
                    {startLocation.name}
                  </p>
                </div>
              )}

              {endLocation && (
                <div>
                  <p className="text-sm font-medium">Target Location</p>
                  <p className="text-xs text-muted-foreground">
                    {endLocation.name}
                  </p>
                </div>
              )}

              {distance && (
                <div>
                  <p className="text-sm font-medium">Distance</p>
                  <p className="text-xs text-muted-foreground">
                    {distance.toFixed(2)} km
                  </p>
                </div>
              )}

              {distance && compatibleDrones && compatibleDrones.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Switch Drone</p>
                  <Select
                    onValueChange={handleDroneChange}
                    defaultValue={droneId.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a drone" />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleDrones.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name} ({d.rangeKm} km)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button
              className="w-full mb-4"
              onClick={handleSubmit}
              disabled={
                !startLocation ||
                !endLocation ||
                isSubmitting ||
                (distance !== null && distance > drone.rangeKm)
              }
            >
              {isSubmitting
                ? "Calculating..."
                : distance && distance > drone.rangeKm
                ? "Drone Range Insufficient"
                : "Plan Mission"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <MapWithNoSSR
        key={mapKey}
        startLocation={startLocation}
        endLocation={endLocation}
        currentPosition={currentPosition}
        onMapClick={handleMapClick}
        clickMode={clickMode}
      />
      {missionProgress > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${missionProgress * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Mission Progress: {Math.round(missionProgress * 100)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default MissionPage;
