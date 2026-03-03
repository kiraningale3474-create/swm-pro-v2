import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [40.7128, -74.006],
  zoom = 13,
  onMapReady,
  className = "",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Call callback when map is ready
    if (onMapReady) {
      onMapReady(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, zoom, onMapReady]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-[20px] ${className}`}
      style={{
        minHeight: "400px",
      }}
    />
  );
};

export default LeafletMap;
