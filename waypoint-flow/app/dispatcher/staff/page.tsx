"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, Clock, ShieldOff } from "lucide-react";

type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  depot: string | null;
  outletId: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  dispatcher:    "chip bg-purple-50 text-purple-700",
  loader:        "chip bg-blue-50 text-blue-700",
  driver:        "chip bg-wp-pale text-wp-green",
  store_manager: "chip bg-amber-50 text-amber-700",
};

const ROLE_LABEL: Record<string, string> = {
  dispatcher:    "Dispatcher",
  loader:        "Loader",
  driver:        "Driver",
  store_manager: "Store Manager",
};

// Demo staff matching the seed data
const DEMO_STAFF: StaffMember[] = [
  { userId: "user-dispatcher", name: "Nilantha Perera",   email: "dispatcher@waypoint.lk", role: "dispatcher",    depot: "Peliyagoda", outletId: null     },
  { userId: "user-loader",     name: "Chamara Bandara",   email: "loader@waypoint.lk",     role: "loader",        depot: "Peliyagoda", outletId: null     },
  { userId: "user-driver",     name: "Roshan Jayasinghe", email: "driver@waypoint.lk",     role: "driver",        depot: "Peliyagoda", outletId: null     },
  { userId: "user-store",      name: "Thilini W.",        email: "store@waypoint.lk",      role: "store_manager", depot: null,         outletId: "OUT005" },
];

export default function StaffPage() {
  const [staff, setStaff]     = useState<StaffMember[]>(DEMO_STAFF);
  const [loading, setLoading] = useState(false);

  const byRole = (role: string) => staff.filter(s => s.role === role);

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Dispatchers",    count: byRole("dispatcher").length,    icon: <ShieldOff size={18} className="text-purple-600" /> },
          { label: "Loaders",        count: byRole("loader").length,        icon: <CheckCircle size={18} className="text-blue-600" /> },
          { label: "Drivers",        count: byRole("driver").length,        icon: <Clock size={18} className="text-wp-green" /> },
          { label: "Store Managers", count: byRole("store_manager").length, icon: <Users size={18} className="text-amber-600" /> },
        ].map(({ label, count, icon }) => (
          <div key={label} className="card-panel p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-wp-pale flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold tabular text-wp-ink">{count}</div>
              <div className="text-xs text-wp-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="card-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-wp-border flex items-center gap-2">
          <Users size={18} className="text-wp-green" />
          <h2 className="font-semibold text-wp-ink">Staff Directory</h2>
          <span className="ml-auto text-xs text-wp-muted">{staff.length} accounts</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-wp-muted text-sm">Loading staff data…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-wp-canvas text-wp-muted text-xs uppercase tracking-wide">
              <tr>
                {["Name", "Email", "Role", "Depot / Outlet"].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-wp-border">
              {staff.map((member) => (
                <tr key={member.userId} className="hover:bg-wp-canvas transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-wp-pale text-wp-green flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-medium text-wp-ink">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-wp-muted">{member.email}</td>
                  <td className="px-5 py-3">
                    <span className={ROLE_BADGE[member.role] ?? "chip bg-gray-100 text-gray-600"}>
                      {ROLE_LABEL[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-wp-muted">
                    {member.depot ?? member.outletId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-wp-muted px-1">
        Staff accounts are managed via Firestore. Passwords can only be reset by an administrator using the <code className="font-mono bg-wp-canvas px-1 py-0.5 rounded">manage-mobile-account</code> script.
      </p>
    </div>
  );
}
