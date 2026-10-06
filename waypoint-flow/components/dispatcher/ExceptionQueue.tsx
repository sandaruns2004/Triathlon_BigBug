"use client";
import { useState } from "react";
import { TriangleAlert, MapPin, PackageX, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exception {
  exceptionId: string;
  type:        string;
  title:       string;
  detail:      string;
  severity:    string;
  createdAt:   string;
}

interface ExceptionQueueProps {
  exceptions: Exception[];
  loading:    boolean;
  onResolve?: (id: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  return hr === 1 ? "1 hr ago" : `${hr} hrs ago`;
}

const ICON: Record<string, React.ReactNode> = {
  breakdown: <TriangleAlert size={18} />,
  shortfall: <PackageX size={18} />,
  delay:     <MapPin size={18} />,
};

const SEVERITY_LINE: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-amber-500",
  medium:   "bg-blue-400",
  low:      "bg-gray-300",
};

const SEVERITY_ICON: Record<string, string> = {
  critical: "bg-red-50 text-red-600",
  high:     "bg-amber-50 text-amber-600",
  medium:   "bg-blue-50 text-blue-600",
  low:      "bg-gray-50 text-gray-600",
};

export function ExceptionQueue({ exceptions, loading, onResolve }: ExceptionQueueProps) {
  const [localResolved, setLocalResolved] = useState<Set<string>>(new Set());

  const activeExceptions = exceptions.filter(e => !localResolved.has(e.exceptionId));
  const count = activeExceptions.filter((e) => e.severity === "critical" || e.severity === "high").length;

  const handleResolve = async (exceptionId: string) => {
    // Instantly remove it from the UI for responsive UX (optimistic update)
    setLocalResolved(prev => {
      const next = new Set(prev);
      next.add(exceptionId);
      return next;
    });
    
    if (onResolve) onResolve(exceptionId);
    
    // Call the backend API to actually resolve it in the database
    try {
      const res = await fetch(`/api/dispatcher/exceptions/${exceptionId}/resolve`, {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Failed to resolve on backend");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to resolve exception on the server.");
      // Rollback optimistic update if it fails
      setLocalResolved(prev => {
        const next = new Set(prev);
        next.delete(exceptionId);
        return next;
      });
    }
  };

  return (
    <div className="card-panel h-full flex flex-col">
      <div className="p-5 border-b border-wp-border flex items-center justify-between">
        <h2 className="text-section-title text-wp-ink flex items-center gap-2">
          Action Required
          {count > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {count}
            </span>
          )}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-wp-border rounded-card p-4 animate-pulse">
              <div className="h-4 bg-wp-border rounded w-3/4 mb-2" />
              <div className="h-3 bg-wp-border rounded w-full" />
            </div>
          ))
        ) : activeExceptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-wp-muted text-sm gap-2">
            <AlertCircle size={28} className="text-wp-border" />
            No active exceptions
          </div>
        ) : (
          activeExceptions.map((ex) => (
            <div
              key={ex.exceptionId}
              className="border border-wp-border rounded-card p-4 hover:border-wp-action transition-colors cursor-pointer relative overflow-hidden"
            >
              <div className={cn("absolute left-0 top-0 bottom-0 w-1", SEVERITY_LINE[ex.severity] ?? "bg-gray-300")} />
              <div className="flex items-start gap-3 pl-2">
                <div className={cn("p-2 rounded-full", SEVERITY_ICON[ex.severity] ?? "bg-gray-50 text-gray-600")}>
                  {ICON[ex.type] ?? <AlertCircle size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-wp-ink">{ex.title}</h3>
                    <span className="text-xs text-wp-muted whitespace-nowrap ml-2">{timeAgo(ex.createdAt)}</span>
                  </div>
                  <p className="text-sm text-wp-muted mt-1 leading-snug">{ex.detail}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleResolve(ex.exceptionId); }}
                    className="mt-3 text-xs font-semibold text-wp-action hover:text-wp-green"
                  >
                    Review &amp; Resolve →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
