"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HealthStrip } from "@/components/dispatcher/HealthStrip";
import { TripsTable } from "@/components/dispatcher/TripsTable";
import { ExceptionQueue } from "@/components/dispatcher/ExceptionQueue";

// Leaflet must be dynamically imported (no SSR)
const RouteMap = dynamic(() => import("@/components/dispatcher/RouteMap"), {
  ssr: false,
  loading: () => <div className="card-panel bg-wp-pale w-full h-full animate-pulse rounded-panel" />,
});

interface OverviewData {
  metrics:    Record<string, number>;
  trips:      any[];
  exceptions: any[];
}

export default function DispatcherOverviewPage() {
  const [data, setData]       = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/dispatcher/overview")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      <HealthStrip
        metrics={data?.metrics as any}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700">
          Failed to load overview data: {error}. Make sure you have run the seed script first.
        </div>
      )}

      <div className="flex-1 grid grid-cols-[1fr_320px] gap-6 min-h-0">
        {/* Left: Map + Table */}
        <div className="flex flex-col gap-6 min-h-0">
          <div className="flex-1 min-h-[280px]">
            <RouteMap trips={data?.trips ?? []} />
          </div>
          <div className="flex-shrink-0">
            <TripsTable trips={data?.trips ?? []} loading={loading} />
          </div>
        </div>

        {/* Right: Exceptions */}
        <div className="min-h-0">
          <ExceptionQueue exceptions={data?.exceptions ?? []} loading={loading} />
        </div>
      </div>
    </div>
  );
}
