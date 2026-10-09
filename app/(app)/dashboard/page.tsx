"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Kpis, PageHead, Panel } from "@/components/ui";
import { money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import {
  IconCalendarDays,
  IconOpd,
  IconAppointments,
  IconBed,
  IconBilling,
  IconCreditCard,
  IconCheckCircle,
  IconAlertTriangle,
  IconPharmacy,
  IconUserPlus,
  IconCalendarPlus,
  IconVendor,
  IconChevronRight,
  IconActivity,
} from "@/components/icons";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatCurrentDate() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getTimeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

export default function Dashboard() {
  const { me, can } = useSession();
  const router = useRouter();
  const { data: d } = useData<any>("/api/dashboard");
  const [today, setToday] = useState(formatCurrentDate);
  const [timeGreeting, setTimeGreeting] = useState(getTimeGreeting);

  useEffect(() => {
    setToday(formatCurrentDate());
    setTimeGreeting(getTimeGreeting());
  }, []);

  const k: Parameters<typeof Kpis>[0]["items"] = [];
  if (d?.opd)
    k.push({
      label: "OPD Today",
      value: d.opd.total,
      sub: `${d.opd.waiting} waiting · ${d.opd.in_consultation} in room`,
      tone: d.opd.waiting > 15 ? "warn" : "ok",
      icon: <IconOpd size={18} />,
      onClick: () => router.push("/opd"),
    });
  if (d?.appointments)
    k.push({
      label: "Appointments",
      value: d.appointments.total,
      sub: `${d.appointments.pending} yet to arrive`,
      tone: "pend",
      icon: <IconAppointments size={18} />,
      onClick: () => router.push("/appointments"),
    });
  if (d?.beds) {
    const occ = d.beds.total ? Math.round((d.beds.occupied / d.beds.total) * 100) : 0;
    k.push({
      label: "Bed Occupancy",
      value: `${occ}%`,
      sub: `${d.beds.available} free · ${d.beds.cleaning} cleaning`,
      tone: occ > 90 ? "crit" : occ > 75 ? "warn" : "ok",
      icon: <IconBed size={18} />,
      onClick: () => router.push("/ipd"),
    });
    k.push({
      label: "Admitted Today",
      value: d.admittedToday,
      tone: "pend",
      icon: <IconUserPlus size={18} />,
      onClick: () => router.push("/ipd"),
    });
  }
  if (d?.revenue)
    k.push({
      label: "Collected Today",
      value: money(d.revenue.collected_today),
      sub: `${d.revenue.receipts} receipts issued`,
      tone: "ok",
      icon: <IconBilling size={18} />,
      onClick: () => router.push("/billing"),
    });
  if (d?.receivables)
    k.push({
      label: "Receivables",
      value: money(d.receivables.outstanding),
      sub: `${d.receivables.invoices} open invoices`,
      tone: "warn",
      icon: <IconCreditCard size={18} />,
      onClick: () => router.push("/billing?status=unpaid,partly_paid"),
    });
  if (d?.pendingApprovals != null)
    k.push({
      label: "Discount Approvals",
      value: d.pendingApprovals,
      sub: d.pendingApprovals ? "awaiting MS approval" : "none pending",
      tone: d.pendingApprovals ? "warn" : "ok",
      icon: <IconCheckCircle size={18} />,
      onClick: () => router.push("/billing?status=draft"),
    });
  if (d?.stock)
    k.push({
      label: "Stock Alerts",
      value: d.stock.low_stock + d.stock.near_expiry,
      sub: `${d.stock.low_stock} low · ${d.stock.near_expiry} near expiry`,
      tone: d.stock.low_stock ? "crit" : "warn",
      icon: <IconAlertTriangle size={18} />,
      onClick: () => router.push("/inventory"),
    });
  if (d?.pendingRx != null)
    k.push({
      label: "Prescriptions",
      value: d.pendingRx,
      sub: "pending dispensation",
      tone: "pend",
      icon: <IconPharmacy size={18} />,
      onClick: () => router.push("/pharmacy"),
    });

  const quick = [
    can("patient.write") && {
      href: "/patients?new=1",
      t: "Register a patient",
      s: "New MRN, ABHA number and clinical allergy capture",
      icon: IconUserPlus,
    },
    can("appointment.write") && {
      href: "/appointments",
      t: "Book an appointment",
      s: "Doctor schedule slot grid by branch and date",
      icon: IconCalendarPlus,
    },
    can("opd.read") && {
      href: "/opd",
      t: "Open the OPD queue",
      s: "Live consultation board with triage priority ranking",
      icon: IconActivity,
    },
    can("ipd.write") && {
      href: "/ipd",
      t: "Admit to a bed",
      s: "Interactive bed board by ward, floor and tariff",
      icon: IconBed,
    },
    can("payment.collect") && {
      href: "/billing",
      t: "Collect a payment",
      s: "Settle open invoices via UPI, card or cash",
      icon: IconCreditCard,
    },
    can("pharmacy.sell") && {
      href: "/pharmacy",
      t: "Dispense medicines",
      s: "E-prescription queue and direct POS sales",
      icon: IconPharmacy,
    },
    can("vendor.read") && {
      href: "/vendor",
      t: "Vendor console",
      s: "Enterprise contracts, invoices and licence keys",
      icon: IconVendor,
    },
  ].filter(Boolean) as { href: string; t: string; s: string; icon: any }[];

  return (
    <>
      <PageHead
        kicker={
          <span suppressHydrationWarning style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconCalendarDays size={14} /> {today}
          </span>
        }
        title={<span suppressHydrationWarning>{`Good ${timeGreeting}, ${me?.fullName ? me.fullName.split(" ")[0] : "Staff"}`}</span>}
      />
      {k.length > 0 && <Kpis items={k} />}
      <div className="page">
        <Panel title="Quick Operations">
          <div className="quick">
            {quick.map((q) => {
              const QuickIcon = q.icon;
              return (
                <Link key={q.href} href={q.href} className="quick-item">
                  <div className="quick-icon">
                    <QuickIcon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{q.t}</div>
                    <div className="muted small ellipsis" style={{ marginTop: 2 }}>{q.s}</div>
                  </div>
                  <IconChevronRight size={18} className="quick-arrow" />
                </Link>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}
