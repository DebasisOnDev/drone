"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Mission } from "@/lib/types";

interface MapComponentProps {
  mission: Mission;
  update?: {
    currentPosition?: { lat: number; lng: number };
    heading?: number;
    altitude?: number;
    speed?: number;
    batteryLevel?: number;
  };
}

// Create custom icons using Lucide React SVGs
const createCustomIcon = (icon: string, color: string) => {
  return L.divIcon({
    className: "custom-icon",
    html: `
      <div style="
        background-color: ${color};
        border-radius: 50%;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${icon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const startIcon = createCustomIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  "#22c55e"
);

const targetIcon = createCustomIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  "#ef4444"
);

// Create a custom drone icon
const createDroneIcon = (heading: number) => {
  return L.divIcon({
    className: "drone-icon",
    html: `
      <div style="
        transform: rotate(${heading}deg);
        transition: transform 0.5s ease;
        background-color: #2563eb;
        border-radius: 50%;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to handle map updates
const MapUpdater = ({
  position,
  heading,
}: {
  position: [number, number];
  heading: number;
}) => {
  const map = useMap();

  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ mission, update }) => {
  return (
    <MapContainer
      center={[
        update?.currentPosition?.lat || mission.startLat,
        update?.currentPosition?.lng || mission.startLng,
      ]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Start Marker */}
      <Marker position={[mission.startLat, mission.startLng]} icon={startIcon}>
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">Start Location</h3>
            <p className="text-sm text-muted-foreground">
              {mission.startLocation}
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Target Marker */}
      <Marker
        position={[mission.targetLat, mission.targetLng]}
        icon={targetIcon}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">Target Location</h3>
            <p className="text-sm text-muted-foreground">
              {mission.targetLocation}
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Current Position Marker */}
      {update?.currentPosition && (
        <>
          <Marker
            position={[update.currentPosition.lat, update.currentPosition.lng]}
            icon={createDroneIcon(update.heading || 0)}
          >
            <Popup>
              <div className="p-2 space-y-2">
                <h3 className="font-semibold">Drone Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Altitude</p>
                    <p className="font-medium">
                      {update.altitude?.toFixed(1)} m
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Speed</p>
                    <p className="font-medium">
                      {update.speed?.toFixed(1)} km/min
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Battery</p>
                    <p className="font-medium">
                      {update.batteryLevel?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Heading</p>
                    <p className="font-medium">{update.heading?.toFixed(1)}°</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
          <MapUpdater
            position={[update.currentPosition.lat, update.currentPosition.lng]}
            heading={update.heading || 0}
          />
        </>
      )}

      {/* Path Line */}
      <Polyline
        positions={[
          [mission.startLat, mission.startLng],
          [mission.targetLat, mission.targetLng],
        ]}
        color="#2563eb"
        weight={3}
        opacity={0.6}
        dashArray="5, 10"
      />
    </MapContainer>
  );
};

export default MapComponent;
