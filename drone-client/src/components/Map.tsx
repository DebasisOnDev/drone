"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Location } from "@/lib/types";

interface MapProps {
  startLocation: Location | null;
  endLocation: Location | null;
  currentPosition: Location | null;
  onMapClick: (lat: number, lng: number) => void;
  clickMode: "start" | "end" | null;
}

function MapEvents({
  onMapClick,
  clickMode,
}: {
  onMapClick: (lat: number, lng: number) => void;
  clickMode: "start" | "end" | null;
}) {
  useMapEvents({
    click: (e) => {
      if (clickMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const Map = ({
  startLocation,
  endLocation,
  currentPosition,
  onMapClick,
  clickMode,
}: MapProps) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Fix for default marker icons in Leaflet with Next.js
    const DefaultIcon = L.icon({
      iconUrl: "/images/marker-icon.png",
      iconRetinaUrl: "/images/marker-icon-2x.png",
      shadowUrl: "/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const DroneIcon = L.icon({
      iconUrl: "/images/drone-icon.png",
      iconRetinaUrl: "/images/drone-icon-2x.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.Marker.prototype.options.icon = DefaultIcon;
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return <div className="h-full w-full bg-gray-100" />;
  }

  const startIcon = new Icon({
    iconUrl: "/marker-start.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const endIcon = new Icon({
    iconUrl: "/marker-end.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const currentIcon = new Icon({
    iconUrl: "/marker-current.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <MapEvents onMapClick={onMapClick} clickMode={clickMode} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {startLocation && (
        <Marker
          position={[startLocation.lat, startLocation.lng]}
          icon={startIcon}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">Start Location</h3>
              <p className="text-sm text-gray-600">{startLocation.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
      {endLocation && (
        <Marker position={[endLocation.lat, endLocation.lng]} icon={endIcon}>
          <Popup>
            <div>
              <h3 className="font-semibold">Target Location</h3>
              <p className="text-sm text-gray-600">{endLocation.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
      {currentPosition && (
        <Marker
          position={[currentPosition.lat, currentPosition.lng]}
          icon={currentIcon}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">Current Position</h3>
              <p className="text-sm text-gray-600">{currentPosition.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
      {startLocation && endLocation && (
        <Polyline
          positions={[
            [startLocation.lat, startLocation.lng],
            [endLocation.lat, endLocation.lng],
          ]}
          color="blue"
          weight={3}
          opacity={0.7}
        />
      )}
    </MapContainer>
  );
};

export default Map;
