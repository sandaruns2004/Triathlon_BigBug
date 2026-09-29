"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Trip {
  tripId:     string;
  vehicleId:  string;
  driverName: string;
  status:     string;
  lat:        number | null;
  lng:        number | null;
}

export default function RouteMap({ trips = [] }: { trips?: Trip[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="card-panel bg-wp-pale w-full h-full animate-pulse" />;

  return (
    <div className="card-panel overflow-hidden w-full h-full flex flex-col relative z-0">
      <div className="p-4 bg-white border-b border-wp-border absolute top-0 left-0 right-0 z-[1000] shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-semibold text-wp-ink">Live Fleet Map</h2>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs text-wp-muted">
            <span className="w-2 h-2 rounded-full bg-wp-green animate-pulse"></span>
            Live (3 sec)
          </span>
        </div>
      </div>
      
      <MapContainer 
        center={[6.9271, 79.8612]} // Colombo, Sri Lanka
        zoom={12} 
        className="w-full h-full pt-[60px]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Dynamic markers from Firestore trip data */}
        {trips
          .filter((t) => t.lat !== null && t.lng !== null)
          .map((trip) => (
            <Marker key={trip.tripId} position={[trip.lat!, trip.lng!]} icon={customIcon}>
              <Popup>
                <div className="p-1">
                  <strong className="text-wp-ink block mb-1">{trip.vehicleId}</strong>
                  <div className="text-xs text-wp-muted">Driver: {trip.driverName}</div>
                  <div className="text-xs text-wp-muted capitalize">Status: {trip.status.replace("_", " ")}</div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
