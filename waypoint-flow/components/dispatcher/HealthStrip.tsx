"use client";

import { useEffect, useState } from "react";
import { Package, Route, TriangleAlert, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Metrics {
  ordersToPlan:     number;
  tripsPlanned:     number;
  tripsTotal:       number;
  fleetActive:      number;
  fleetTotal:       number;
  driversIn:        number;
  driversTotal:     number;
  activeExceptions: number;
}

interface HealthStripProps {
  metrics?: Metrics;
  loading?: boolean;
}

export function HealthStrip({ metrics, loading }: HealthStripProps) {
  const m = metrics ?? {
    ordersToPlan: 0, tripsPlanned: 0, tripsTotal: 0,
    fleetActive: 0, fleetTotal: 0, driversIn: 0, driversTotal: 0, activeExceptions: 0,
  };

  const cards = [
    { id: "orders",     label: "Orders to plan",     value: m.ordersToPlan,   total: undefined,      icon: <Package size={18} />,      colorClass: "text-wp-ink" },
    { id: "trips",      label: "Trips planned",       value: m.tripsPlanned,   total: m.tripsTotal,   icon: <Route size={18} />,        colorClass: "text-wp-green" },
    { id: "fleet",      label: "Fleet active",        value: m.fleetActive,    total: m.fleetTotal,   icon: <Truck size={18} />,        colorClass: "text-wp-action" },
    { id: "staff",      label: "Drivers clocked in",  value: m.driversIn,      total: m.driversTotal, icon: <Users size={18} />,        colorClass: "text-wp-ink" },
    { id: "exceptions", label: "Active exceptions",   value: m.activeExceptions, total: undefined,    icon: <TriangleAlert size={18} />, colorClass: "text-amber-600", active: m.activeExceptions > 0 },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {cards.map((c) => (
        <button
          key={c.id}
          className={cn(
            "card p-4 text-left transition-all hover:border-wp-action hover:shadow-md",
            (c as any).active ? "border-amber-300 bg-amber-50" : ""
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("p-1.5 rounded-md bg-wp-canvas", c.colorClass)}>
              {c.icon}
            </div>
            <span className="text-sm font-medium text-wp-muted">{c.label}</span>
          </div>
          {loading ? (
            <div className="h-7 w-16 bg-wp-border rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold tabular", c.colorClass)}>{c.value}</span>
              {c.total !== undefined && (
                <span className="text-sm font-medium text-wp-muted tabular">/ {c.total}</span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
