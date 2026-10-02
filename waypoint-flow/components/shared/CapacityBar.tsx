import { cn } from "@/lib/utils";

interface CapacityBarProps {
  label: string;
  used: number;
  total: number;
  unit: string;
  invertColors?: boolean;
}

export function CapacityBar({ label, used, total, unit, invertColors = false }: CapacityBarProps) {
  const rawPercentage = total > 0 ? (used / total) * 100 : (used > 0 ? 101 : 0);
  const percentage = Math.max(0, Math.min(rawPercentage, 100));
  
  let fillClass = "bg-wp-action";
  if (rawPercentage > 100) fillClass = "bg-red-500";
  else if (percentage > 90) fillClass = "bg-amber-400";

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", invertColors ? "text-white/70" : "text-wp-muted")}>{label}</span>
        <span className={cn("text-xs font-medium tabular", invertColors ? "text-white" : "text-wp-ink")}>
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
