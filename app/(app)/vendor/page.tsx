"use client";
import { useState } from "react";
import { LICENSABLE_MODULES, label } from "@sevana/shared";
import { IconAlertTriangle, IconCheckCircle, IconClock, IconCreditCard, IconPlus, IconUserPlus, IconVendor } from "@/components/icons";
import { DataTable, Dialog, FormDialog, Kpis, opts, PageHead, Panel, Tabs, Tag, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { date, dt, money, todayIso } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

export default function Vendor() {
  const { toast } = useSession();
  const [tab, setTab] = useState("contracts");
  const summary = useData<any>("/api/vendor/summary");
  const contracts = useData<any[]>("/api/vendor/contracts");
  const plans = useData<any[]>("/api/vendor/plans");
  const customers = useData<any[]>("/api/vendor/customers");
  const [open, setOpen] = useState<string | null>(null);
  const [dlg, setDlg] = useState<"plan" | "customer" | "contract" | null>(null);
  const s = summary.data;
  const refresh = () => { void summary.reload(); void contracts.reload(); };
  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconVendor size={14} /> Sevana Vendor Desk</span>}
        title="Vendor Console"
        actions={<>
          <button className="btn btn-secondary" onClick={() => setDlg("customer")} type="button"><IconUserPlus size={14} style={{ marginRight: 6 }} /> New customer</button>
          <button className="btn btn-secondary" onClick={() => setDlg("plan")} type="button"><IconPlus size={14} style={{ marginRight: 6 }} /> New plan</button>
          <button className="btn btn-primary" onClick={() => setDlg("contract")} type="button"><IconPlus size={14} style={{ marginRight: 6 }} /> New contract</button>
        </>}
      />
      {s && <Kpis items={[
        { label: "Customers", value: s.customers, icon: <IconVendor size={16} /> },
        { label: "Active", value: s.active, tone: "ok", sub: "contracts", icon: <IconCheckCircle size={16} /> },
        { label: "In grace", value: s.grace, tone: "warn", sub: "payment overdue", icon: <IconClock size={16} /> },
        { label: "Suspended", value: s.suspended, tone: "crit", icon: <IconAlertTriangle size={16} /> },
        { label: "Renewals ≤ 30 days", value: s.renewals30d, tone: "pend", icon: <IconClock size={16} /> },
        { label: "Receivable", value: money(s.receivable), sub: `${money(s.overdue)} overdue`, tone: s.overdue ? "crit" : "ok", icon: <IconCreditCard size={16} /> },
      ]} />}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "contracts", label: "Contracts", count: contracts.data?.length }, { id: "plans", label: "Plans" }, { id: "customers", label: "Customers" }]} />
      <div className="page">
        {tab === "contracts" && <Panel pad={false}>
          <DataTable rows={contracts.data} onRow={(c: any) => setOpen(c.id)} cols={[
            { key: "code", head: "Contract", render: (c: any) => <span className="mono strong">{c.code}</span> }, { key: "customerName", head: "Hospital" },
            { key: "planName", head: "Plan" }, { key: "amount", head: "Amount", align: "right", render: (c: any) => money(c.amount) },
            { key: "nextDue", head: "Next due", render: (c: any) => <span className={c.nextDue < todayIso() ? "crit strong" : ""}>{date(c.nextDue)}</span> },
            { key: "keyValidUntil", head: "Key valid until", render: (c: any) => date(c.keyValidUntil) }, { key: "status", head: "Status", render: (c: any) => <Tag s={c.status} /> },
          ]} />
        </Panel>}
        {tab === "plans" && <Panel pad={false}>
          <DataTable rows={plans.data} cols={[
            { key: "name", head: "Plan" }, { key: "model", head: "Model", render: (p: any) => label(p.model) }, { key: "billingCycle", head: "Cycle" },
            { key: "price", head: "Price", align: "right", render: (p: any) => money(p.price) }, { key: "amcPercent", head: "AMC %", align: "right", render: (p: any) => Number(p.amcPercent) || "—" },
            { key: "limits", head: "Branches / users", render: (p: any) => `${p.maxBranches} / ${p.maxUsers}` },
            { key: "modules", head: "Modules", render: (p: any) => <span className="small">{p.modules.map(label).join(", ")}</span> },
          ]} />
        </Panel>}
        {tab === "customers" && <Panel pad={false}>
          <DataTable rows={customers.data} cols={[{ key: "code", head: "Code" }, { key: "name", head: "Hospital" }, { key: "city", head: "City" }, { key: "beds", head: "Beds" },
            { key: "contactName", head: "Contact" }, { key: "contactEmail", head: "Email" }]} />
        </Panel>}
      </div>
      {open && <ContractDialog id={open} onClose={() => { setOpen(null); refresh(); }} />}
      {dlg === "plan" && <FormDialog title="New licence plan" onClose={() => setDlg(null)} initial={{ model: "subscription", billingCycle: "quarterly", maxBranches: 1, maxUsers: 25, modules: [] }}
        fields={[{ name: "name", label: "Name", required: true }, { name: "model", label: "Model", type: "select", options: [{ value: "subscription", label: "Subscription" }, { value: "perpetual_amc", label: "Perpetual + AMC" }] },
          { name: "billingCycle", label: "Billing cycle", type: "select", options: ["monthly", "quarterly", "annual"].map((x) => ({ value: x, label: x })) },
          { name: "price", label: "Price per cycle / licence fee (₹)", type: "number", required: true }, { name: "amcPercent", label: "AMC % (perpetual)", type: "number" },
          { name: "maxBranches", label: "Max branches", type: "number" }, { name: "maxUsers", label: "Max users", type: "number" },
          { name: "modules", label: "Modules", type: "multi", span: 3, options: LICENSABLE_MODULES.map((m) => ({ value: m, label: label(m) })) }]}
        submit={async (v) => { await api.post("/api/vendor/plans", v); toast("Plan created"); setDlg(null); void plans.reload(); }} />}
      {dlg === "customer" && <FormDialog title="New hospital customer" onClose={() => setDlg(null)} fields={[
        { name: "name", label: "Hospital / group", required: true, span: 2 }, { name: "city", label: "City" }, { name: "beds", label: "Beds", type: "number" },
        { name: "gstin", label: "GSTIN" }, { name: "contactName", label: "Contact" }, { name: "contactEmail", label: "Contact email", type: "email" }]}
        submit={async (v) => { await api.post("/api/vendor/customers", v); toast("Customer created"); setDlg(null); void customers.reload(); refresh(); }} />}
      {dlg === "contract" && <FormDialog title="New contract" onClose={() => setDlg(null)} initial={{ startDate: todayIso(), graceDays: 15 }} fields={[
        { name: "customerId", label: "Customer", type: "select", required: true, span: 2, options: opts(customers.data, (c: any) => c.name) },
        { name: "planId", label: "Plan", type: "select", required: true, options: opts(plans.data, (p: any) => p.name) },
        { name: "startDate", label: "Start", type: "date", required: true }, { name: "endDate", label: "End (optional)", type: "date" }, { name: "graceDays", label: "Grace days", type: "number" },
        { name: "amount", label: "Override amount (₹)", type: "number", hint: "Defaults to plan price" }, { name: "branches", label: "Branches", type: "number" }, { name: "users", label: "Users", type: "number" }]}
        submit={async (v) => { await api.post("/api/vendor/contracts", v); toast("Contract created"); setDlg(null); refresh(); }} />}
    </>
  );
}

function ContractDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { toast } = useSession();
  const { data: c, reload } = useData<any>(`/api/vendor/contracts/${id}`);
  const [key, setKey] = useState<string | null>(null);
  const { busy, run } = useAction(toast);
  const post = (url: string, body: unknown, ok: string) => run(url, () => api.post(url, body), ok).then(() => reload());
  if (!c) return null;
  const live = ["active", "grace"].includes(c.status);
  return (
    <Dialog wide title={`${c.code} · ${c.customerName}`} onClose={onClose} actions={<>
      {live && <button className="btn btn-secondary" disabled={!!busy} onClick={() => post(`/api/vendor/contracts/${id}/raise-invoice`, {}, "Invoice raised")} type="button">Raise invoice</button>}
      {live && <button className="btn btn-primary" disabled={!!busy} type="button"
        onClick={() => run("key", async () => { const r = await api.post(`/api/vendor/contracts/${id}/issue-key`); setKey(r.licenceKey); await reload(); }, "Licence key issued")}>Issue licence key</button>}
      {live && <button className="btn btn-ghost" type="button" onClick={() => { const reason = window.prompt("Suspension reason?"); if (reason) void post(`/api/vendor/contracts/${id}/suspend`, { reason }, "Suspended"); }}>Suspend</button>}
      {c.status === "suspended" && <button className="btn btn-secondary" type="button" onClick={() => post(`/api/vendor/contracts/${id}/reinstate`, {}, "Reinstated")}>Reinstate</button>}
    </>}>
      <div className="row gap-3 wrap" style={{ marginBottom: 12 }}>
        <Tag s={c.status} /><span>{c.plan.name} · {label(c.plan.model)} · {c.plan.billingCycle}</span><span className="muted">·</span>
        <span>{money(c.amount)}</span><span className="muted">· next due {date(c.nextDue)} · grace {c.graceDays} d · {c.branches} branches / {c.users} users</span>
      </div>
      {c.suspensionReason && <div className="alert alert-crit">Suspended: {c.suspensionReason}</div>}
      {(key || c.licenceKey) && <div style={{ marginBottom: 14 }}>
        <div className="small muted">Current key · valid until {date(c.keyValidUntil)} · issued {dt(c.keyIssuedAt)}. Send to the hospital admin to paste in Settings.</div>
        <div className="keybox">{key ?? c.licenceKey}</div>
      </div>}
      <DataTable rows={c.invoices} empty="No invoices raised." cols={[
        { key: "code", head: "Invoice" }, { key: "invoiceType", head: "Type", render: (i: any) => label(i.invoiceType) },
        { key: "period", head: "Period", render: (i: any) => `${date(i.periodFrom)} – ${date(i.periodTo)}` },
        { key: "total", head: "Total (incl. 18% GST)", align: "right", render: (i: any) => money(i.total) },
        { key: "status", head: "Status", render: (i: any) => <Tag s={i.status === "unpaid" && i.dueDate < todayIso() ? "overdue" : i.status} /> },
        { key: "x", head: "", render: (i: any) => i.status === "unpaid" ? <div className="row gap-2">
          <button className="btn btn-secondary small" type="button" onClick={() => { const reference = window.prompt("Payment reference (UTR / cheque no.)?"); if (reference) void post(`/api/vendor/invoices/${i.id}/mark-paid`, { reference }, "Marked paid"); }}>Mark paid</button>
          <button className="btn btn-ghost small" type="button" onClick={() => window.confirm("Cancel this invoice?") && post(`/api/vendor/invoices/${i.id}/cancel`, {}, "Invoice cancelled")}>Cancel</button>
        </div> : i.paymentReference ?? null },
      ]} />
    </Dialog>
  );
}
