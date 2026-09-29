import { StatusChip, type Status } from "@/components/shared/StatusChip";
import { CapacityBar } from "@/components/shared/CapacityBar";

interface Trip {
  tripId:         string;
  vehicleId:      string;
  driverName:     string;
  status:         string;
  stopCount:      number;
  stopsCompleted: number;
  weightKg:       number;
  weightCapKg:    number;
  volumeM3:       number;
  volumeCapM3:    number;
}

interface TripsTableProps {
  trips:   Trip[];
  loading: boolean;
}

export function TripsTable({ trips, loading }: TripsTableProps) {
  return (
    <div className="card-panel overflow-hidden flex flex-col">
      <div className="p-5 border-b border-wp-border flex items-center justify-between">
        <h2 className="text-section-title text-wp-ink">Today's Trips</h2>
        <span className="text-sm text-wp-muted tabular">{trips.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-wp-canvas border-b border-wp-border">
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase">Trip</th>
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase">Vehicle & Driver</th>
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase">Stops</th>
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase w-[200px]">Weight</th>
              <th className="px-5 py-3 text-xs font-semibold text-wp-muted uppercase w-[200px]">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wp-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-wp-border rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-wp-muted text-sm">
                  No trips planned for today. Use the Plan Builder to create one.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.tripId} className="hover:bg-wp-pale/50 transition-colors cursor-pointer">
                  <td className="px-5 py-4 text-sm font-semibold text-wp-ink">{trip.tripId}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-wp-ink">{trip.vehicleId}</div>
                    <div className="text-xs text-wp-muted">{trip.driverName}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusChip status={trip.status as Status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-wp-ink tabular">
                    {trip.stopsCompleted}/{trip.stopCount}
                  </td>
                  <td className="px-5 py-4">
                    <CapacityBar label="Weight" used={trip.weightKg} total={trip.weightCapKg} unit="kg" />
                  </td>
                  <td className="px-5 py-4">
                    <CapacityBar label="Volume" used={trip.volumeM3} total={trip.volumeCapM3} unit="m³" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
