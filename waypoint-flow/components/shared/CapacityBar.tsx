import { cn } from "@/lib/utils";

interface CapacityBarProps {
  label: string;
  used: number;
  total: number;
  unit: string;
  invertColors?: boolean;
}

export function CapacityBar({ label, used, total, unit, invertColors }: CapacityBarProps) {
  const percentage = Math.min((used / total) * 100, 100);
  
  let fillClass = "bg-wp-action";
  if (percentage > 100) fillClass = "bg-red-500";
  else if (percentage > 90) fillClass = "bg-amber-400";

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-semibold text-wp-muted uppercase tracking-wider">{label}</span>
        <span className="text-xs font-medium text-wp-ink tabular">
          {used.toFixed(0)} <span className="text-wp-muted">/ {total} {unit}</span>
        </span>
      </div>
      <div className="capacity-bar-track">
        <div 
          className={cn("capacity-bar-fill", fillClass)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
