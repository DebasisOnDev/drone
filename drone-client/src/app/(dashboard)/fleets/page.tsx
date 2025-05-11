"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDronesWithAvailability } from "@/lib/api";
import { Drone } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AddDroneDialog } from "@/components/AddDroneDialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FleetCollection = () => {
  const router = useRouter();
  const {
    data: drones,
    isLoading,
    isError,
    error,
  } = useQuery<Drone[]>({
    queryKey: ["drones"],
    queryFn: getDronesWithAvailability,
  });

  const handleStartMission = (id: number) => {
    router.push(`/mission?droneId=${id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Drone Fleet</h1>
        <AddDroneDialog />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drones?.map((drone) => (
          <Card key={drone.id} className="hover:shadow-lg transition-shadow">
            {drone.image && (
              <div className="relative w-full h-48">
                <Image
                  src={drone.image}
                  alt={drone.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{drone.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {drone.type.toUpperCase()} Drone
                  </CardDescription>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Battery Level
                  </p>
                  <Progress value={drone.batteryLevel} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Range</p>
                    <p className="font-medium">{drone.rangeKm} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Flight Time</p>
                    <p className="font-medium">{drone.flightTimeMin} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="font-medium">{drone.totalAvailable} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payload</p>
                    <p className="font-medium capitalize">
                      {drone.payloadType}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Use Case</p>
                  <p className="text-sm mt-1">{drone.exampleUseCase}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleStartMission(drone.id)}
                disabled={drone.droneStatus !== "available"}
              >
                Start Mission
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FleetCollection;
