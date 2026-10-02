"use client";

import { useEffect, useState } from "react";
import { Truck, MapPin, CheckCircle, AlertTriangle, Clock } from "lucide-react";

type Vehicle = {
  vehicleId: string;
  type: string;
  temp: string;
  weightCapKg: number;
  volumeCapM3: number;
  depot: string;
  available: boolean;
  driverName: string | null;
  currentStatus: string;
  lat: number | null;
  lng: number | null;
};

const STATUS_STYLES: Record<string, string> = {
  on_route:        "chip chip-on-route",
  loading:         "chip chip-loading",
  planned:         "chip chip-planned",
  idle:            "chip bg-gray-100 text-gray-500",
  ready_to_depart: "chip chip-ready",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  on_route:        <MapPin size={12} />,
  loading:         <Clock size={12} />,
  planned:         <Clock size={12} />,
  idle:            <CheckCircle size={12} />,
  ready_to_depart: <CheckCircle size={12} />,
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/dispatcher/overview")
      .then((r) => r.json())
      .then((d) => {
        // Trips carry vehicle info; we derive fleet status from trips + seed data
        setVehicles([]); // Will be populated from /api/vehicles once it exists
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });

    // Temporary: fetch vehicles directly from seed data via overview trips
    fetch("/api/dispatcher/fleet")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((d) => { if (d?.vehicles) setVehicles(d.vehicles); })
      .catch(() => {});
  }, []);

  const DEMO_VEHICLES: Vehicle[] = [
    { vehicleId: "WP-001", type: "truck", temp: "ambient", weightCapKg: 4000, volumeCapM3: 18, depot: "Peliyagoda", available: true,  driverName: "Roshan J.",  currentStatus: "on_route",        lat: 6.93,   lng: 79.87 },
    { vehicleId: "WP-014", type: "van",   temp: "reefer",  weightCapKg: 1500, volumeCapM3: 8,  depot: "Peliyagoda", available: true,  driverName: "Kamal P.",  currentStatus: "loading",          lat: 6.92,   lng: 79.86 },
    { vehicleId: "WP-022", type: "truck", temp: "ambient", weightCapKg: 4000, volumeCapM3: 18, depot: "Peliyagoda", available: true,  driverName: "Nimal S.",  currentStatus: "planned",          lat: null,   lng: null  },
    { vehicleId: "WP-031", type: "van",   temp: "ambient", weightCapKg: 1500, volumeCapM3: 8,  depot: "Kandy",      available: true,  driverName: "Asanka W.", currentStatus: "ready_to_depart",  lat: 7.2906, lng: 80.63 },
    { vehicleId: "WP-040", type: "truck", temp: "reefer",  weightCapKg: 4000, volumeCapM3: 18, depot: "Kandy",      available: false, driverName: null,        currentStatus: "idle",             lat: null,   lng: null  },
  ];

  const displayVehicles = vehicles.length > 0 ? vehicles : DEMO_VEHICLES;
  const activeCount   = displayVehicles.filter(v => v.currentStatus === "on_route").length;
  const loadingCount  = displayVehicles.filter(v => v.currentStatus === "loading").length;
  const idleCount     = displayVehicles.filter(v => !v.available || v.currentStatus === "idle").length;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Fleet",    value: displayVehicles.length, color: "text-wp-ink" },
          { label: "On Route",       value: activeCount,            color: "text-wp-green" },
          { label: "Loading",        value: loadingCount,           color: "text-amber-600" },
          { label: "Unavailable",    value: idleCount,              color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-panel p-5">
            <div className={`text-3xl font-bold tabular ${color}`}>{value}</div>
            <div className="text-sm text-wp-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Fleet table */}
      <div className="card-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-wp-border flex items-center gap-2">
          <Truck size={18} className="text-wp-green" />
          <h2 className="font-semibold text-wp-ink">Fleet Registry</h2>
          <span className="ml-auto text-xs text-wp-muted">{displayVehicles.length} vehicles</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-wp-muted text-sm">Loading fleet data…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-wp-canvas text-wp-muted text-xs uppercase tracking-wide">
              <tr>
                {["Vehicle", "Type", "Temp", "Depot", "Driver", "Capacity (kg / m³)", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-wp-border">
              {displayVehicles.map((v) => (
                <tr key={v.vehicleId} className="hover:bg-wp-canvas transition-colors">
                  <td className="px-5 py-3 font-semibold text-wp-ink">{v.vehicleId}</td>
                  <td className="px-5 py-3 capitalize text-wp-muted">{v.type}</td>
                  <td className="px-5 py-3">
                    <span className={`chip text-xs ${v.temp === "reefer" ? "bg-blue-50 text-blue-700" : "bg-wp-pale text-wp-green"}`}>
                      {v.temp}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-wp-muted">{v.depot}</td>
                  <td className="px-5 py-3 text-wp-ink">{v.driverName ?? <span className="text-wp-muted italic">Unassigned</span>}</td>
                  <td className="px-5 py-3 tabular text-wp-muted">
                    {v.weightCapKg.toLocaleString()} kg / {v.volumeCapM3} m³
                  </td>
                  <td className="px-5 py-3">
                    <span className={STATUS_STYLES[v.currentStatus] ?? "chip bg-gray-100 text-gray-500"}>
                      {STATUS_ICON[v.currentStatus]}
                      {v.currentStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Unavailable notice */}
      {idleCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-card px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{idleCount} vehicle(s) marked unavailable and excluded from today's allocation.</span>
        </div>
      )}
    </div>
  );
}
