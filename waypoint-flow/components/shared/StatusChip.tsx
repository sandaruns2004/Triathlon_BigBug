import { cn } from "@/lib/utils";
import {
  Clock, Route, Package, CheckCircle2, Truck,
  TriangleAlert, Clock3, CloudOff, CircleCheck,
} from "lucide-react";

export type Status =
  | "needs_planning"
  | "planned"
  | "loading"
  | "ready_to_depart"
  | "on_route"
  | "delivered"
  | "issue_reported"
  | "deferred"
  | "offline";

const CONFIG: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
  needs_planning:  { label: "Needs planning",  cls: "chip-needs-planning",  icon: <Clock        size={11} /> },
  planned:         { label: "Planned",         cls: "chip-planned",         icon: <Route        size={11} /> },
  loading:         { label: "Loading",         cls: "chip-loading",         icon: <Package      size={11} /> },
  ready_to_depart: { label: "Ready to depart", cls: "chip-ready-to-depart", icon: <CheckCircle2 size={11} /> },
  on_route:        { label: "On route",        cls: "chip-on-route",        icon: <Truck        size={11} /> },
  delivered:       { label: "Delivered",       cls: "chip-delivered",       icon: <CircleCheck  size={11} /> },
  issue_reported:  { label: "Issue reported",  cls: "chip-issue-reported",  icon: <TriangleAlert size={11} /> },
  deferred:        { label: "Deferred",        cls: "chip-deferred",        icon: <Clock3       size={11} /> },
  offline:         { label: "Offline",         cls: "chip-offline",         icon: <CloudOff     size={11} /> },
};

interface StatusChipProps {
  status:    Status;
  className?: string;
}

/**
 * StatusChip — 9 standardised operational states.
 * Color + icon + label: never colour alone (accessibility requirement).
 */
export function StatusChip({ status, className }: StatusChipProps) {
  const { label, cls, icon } = CONFIG[status] ?? CONFIG.needs_planning;
  return (
    <span className={cn("chip", cls, className)}>
      {icon}
      {label}
    </span>
  );
}
