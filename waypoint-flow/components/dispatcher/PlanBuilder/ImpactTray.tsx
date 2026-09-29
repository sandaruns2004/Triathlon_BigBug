"use client";

import { AlertTriangle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImpactTrayProps {
  unassignedCount: number;
  tripsCount: number;
  planStatus: string;
  onAllocate: () => void;
  onPublish: () => void;
  isAllocating: boolean;
  isPublishing: boolean;
}

export function ImpactTray({ unassignedCount, tripsCount, planStatus, onAllocate, onPublish, isAllocating, isPublishing }: ImpactTrayProps) {
  const isPublished = planStatus === "published";

  return (
    <div className="card-panel p-4 flex items-center justify-between mt-6">
      <div className="flex items-center gap-6">
        <div>
          <div className="text-xs font-semibold text-wp-muted uppercase tracking-wider mb-1">Impact Analysis</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-wp-ink">
              <strong className="text-wp-green">{tripsCount}</strong> Trips
            </span>
            {unassignedCount > 0 ? (
              <span className="text-sm font-medium text-amber-600 flex items-center gap-1">
                <AlertTriangle size={14} />
                <strong>{unassignedCount}</strong> Orders to defer
              </span>
            ) : (
              <span className="text-sm font-medium text-wp-green">All orders assigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {planStatus !== "published" && (
          <button
            onClick={onAllocate}
            disabled={isAllocating || unassignedCount === 0}
            className="btn btn-outline"
          >
            {isAllocating ? "Running engine..." : "Auto-suggest allocation"}
          </button>
        )}
        
        <button
          onClick={onPublish}
          disabled={isPublishing || tripsCount === 0 || isPublished}
          className={cn("btn", isPublished ? "bg-wp-green cursor-default hover:bg-wp-green" : "btn-primary")}
        >
          {isPublished ? "Plan Published" : (
            <>
              <Send size={16} className="mr-2 inline" />
              Publish Plan to Fleet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
