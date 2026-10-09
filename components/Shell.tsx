"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ROLE_LABELS, type Permission, type Role } from "@sevana/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  IconDashboard,
  IconPatients,
  IconAppointments,
  IconOpd,
  IconBed,
  IconBilling,
  IconPharmacy,
  IconInventory,
  IconAdmin,
  IconAudit,
  IconVendor,
  IconLogout,
  IconCross,
} from "@/components/icons";

const NAV = [
  {
    group: "Patient care",
    items: [
      { href: "/patients", label: "Patients", perm: "patient.read" as Permission, icon: IconPatients },
      { href: "/appointments", label: "Appointments", perm: "appointment.read" as Permission, icon: IconAppointments },
      { href: "/opd", label: "OPD queue", perm: "opd.read" as Permission, icon: IconOpd },
    ],
  },
  {
    group: "Inpatient",
    items: [{ href: "/ipd", label: "Bed board & admissions", perm: "ipd.read" as Permission, icon: IconBed }],
  },
  {
    group: "Revenue",
    items: [{ href: "/billing", label: "Billing", perm: "invoice.read" as Permission, icon: IconBilling }],
  },
  {
    group: "Pharmacy & stores",
    items: [
      { href: "/pharmacy", label: "Pharmacy", perm: "pharmacy.sell" as Permission, icon: IconPharmacy },
      { href: "/inventory", label: "Inventory", perm: "stock.read" as Permission, icon: IconInventory },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/admin", label: "Masters & users", perm: "masters.write" as Permission, icon: IconAdmin },
      { href: "/admin/audit", label: "Audit log", perm: "audit.read" as Permission, icon: IconAudit },
    ],
  },
  {
    group: "Vendor",
    items: [{ href: "/vendor", label: "Vendor console", perm: "vendor.read" as Permission, icon: IconVendor }],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { me, can } = useSession();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    router.replace("/login");
  };
  const initials =
    me?.fullName
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w) && !w.endsWith("."))
      .slice(0, 2)
      .map((w) => w[0])
      .join("") ?? "";

  return (
    <div className="shell">
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <IconCross size={20} />
          </div>
          <div>
            <div className="brand-name">{me?.hospitalName ?? "Sevana Healthcare"}</div>
            <div className="brand-sub">Hospital Information System</div>
          </div>
        </div>
        <nav className="side-nav" onClick={() => setOpen(false)}>
          <Link href="/dashboard" className={`nav-item ${path === "/dashboard" ? "on" : ""}`}>
            <IconDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          {NAV.map((g) => {
            const items = g.items.filter((i) => can(i.perm));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="nav-group">{g.group}</div>
                {items.map((i) => {
                  const on = path === i.href || (i.href !== "/admin" && path.startsWith(`${i.href}/`));
                  const ItemIcon = i.icon;
                  return (
                    <Link key={i.href} href={i.href} className={`nav-item ${on ? "on" : ""}`}>
                      <ItemIcon size={18} />
                      <span>{i.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="avatar" aria-hidden>{initials}</div>
          <div className="grow minw0">
            <div className="ellipsis strong" style={{ fontSize: 13 }}>{me?.fullName ?? "…"}</div>
            <div className="small muted ellipsis">{me?.roles.map((r) => ROLE_LABELS[r as Role] ?? r).join(", ")}</div>
          </div>
          <button className="btn btn-ghost small" onClick={logout} type="button" title="Sign out" style={{ padding: "6px 8px" }}>
            <IconLogout size={16} />
          </button>
        </div>
      </aside>
      <button className="side-toggle btn btn-secondary" onClick={() => setOpen(!open)} type="button" aria-label="Menu">
        Menu
      </button>
      <main className="main">{children}</main>
    </div>
  );
}
