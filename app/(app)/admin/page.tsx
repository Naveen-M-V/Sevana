"use client";
import { useEffect, useState } from "react";
import { DRUG_SCHEDULES, GST_RATES, ROLE_LABELS, ROLES, WEEKDAYS, label } from "@sevana/shared";
import { IconAdmin, IconBed, IconPlus, IconUser, IconUserPlus } from "@/components/icons";
import { LineEditor } from "@/components/domain";
import { DataTable, ErrorBox, Fields, FormDialog, opts, PageHead, Panel, Tabs, Tag, type Col, type FieldDef } from "@/components/ui";
import { api } from "@/lib/api";
import { dt, money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession, type Lookups } from "@/lib/session";

const o = (xs: readonly (string | number)[]) => xs.map((x) => ({ value: String(x), label: String(x) || "None" }));
const active = { key: "isActive", head: "Status", render: (r: any) => <Tag s={r.isActive ? "active" : "cancelled"}>{r.isActive ? "Active" : "Inactive"}</Tag> };

interface MasterDef { id: string; label: string; url: string; cols: Col<any>[]; fields: (l: Lookups | null) => FieldDef[]; defaults?: Record<string, any>;
  toForm?: (r: any) => Record<string, any>; fromForm?: (v: Record<string, any>) => Record<string, any> }

const MASTERS: MasterDef[] = [
  { id: "branches", label: "Branches", url: "/api/branches", defaults: { isActive: true },
    cols: [{ key: "code", head: "Code" }, { key: "name", head: "Name" }, { key: "city", head: "City" }, { key: "gstin", head: "GSTIN" }, active],
    fields: () => [{ name: "name", label: "Name", required: true, span: 2 }, { name: "code", label: "Code (2–6)", required: true }, { name: "city", label: "City" },
      { name: "gstin", label: "GSTIN" }, { name: "phone", label: "Phone" }, { name: "address", label: "Address", span: 3 }, { name: "isActive", label: "Active", type: "checkbox" }] },
  { id: "departments", label: "Departments", url: "/api/departments", defaults: { isActive: true },
    cols: [{ key: "code", head: "Token prefix" }, { key: "name", head: "Name" }, active],
    fields: () => [{ name: "name", label: "Name", required: true, span: 2 }, { name: "code", label: "Token prefix", required: true, hint: "e.g. C → tokens C-001" },
      { name: "isActive", label: "Active", type: "checkbox" }] },
  { id: "services", label: "Services & tariff", url: "/api/services", defaults: { isActive: true, gstRate: 0, category: "procedure" },
    cols: [{ key: "code", head: "Code" }, { key: "name", head: "Name" }, { key: "category", head: "Category" },
      { key: "rate", head: "Rate", align: "right", render: (r) => money(r.rate) }, { key: "gstRate", head: "GST %", align: "right", render: (r) => Number(r.gstRate) }, active],
    fields: (l) => [{ name: "code", label: "Code", required: true }, { name: "name", label: "Name", required: true, span: 2 },
      { name: "category", label: "Category", type: "select", required: true, options: o(["consultation", "bed", "procedure", "nursing", "investigation", "consumable", "package", "other"]) },
      { name: "rate", label: "Rate (₹)", type: "number", required: true }, { name: "gstRate", label: "GST %", type: "select", options: o(GST_RATES) },
      { name: "departmentId", label: "Department", type: "select", options: opts(l?.departments, (d) => d.name) }, { name: "isActive", label: "Active", type: "checkbox" }],
    fromForm: (v) => ({ ...v, gstRate: Number(v.gstRate ?? 0) }) },
  { id: "wards", label: "Wards", url: "/api/wards", defaults: { isActive: true, wardType: "general" },
    cols: [{ key: "name", head: "Ward" }, { key: "wardType", head: "Type" }, { key: "floor", head: "Floor" },
      { key: "dailyTariff", head: "Tariff/day", align: "right", render: (r) => money(r.dailyTariff) }, active],
    fields: (l) => [{ name: "name", label: "Name", required: true }, { name: "branchId", label: "Branch", type: "select", required: true, options: opts(l?.branches, (b) => b.name) },
      { name: "wardType", label: "Type", type: "select", options: o(["general", "semi_private", "private", "icu", "hdu", "nicu", "maternity"]) }, { name: "floor", label: "Floor" },
      { name: "dailyTariff", label: "Tariff per day (₹)", type: "number", required: true },
      { name: "bedChargeServiceId", label: "Bed charge service", type: "select", options: opts(l?.services.filter((s) => s.category === "bed"), (s) => s.name) },
      { name: "isActive", label: "Active", type: "checkbox" }] },
  { id: "stores", label: "Stores", url: "/api/stores", defaults: { isActive: true, storeType: "central" },
    cols: [{ key: "name", head: "Store" }, { key: "storeType", head: "Type" }, active],
    fields: (l) => [{ name: "name", label: "Name", required: true, span: 2 }, { name: "branchId", label: "Branch", type: "select", required: true, options: opts(l?.branches, (b) => b.name) },
      { name: "storeType", label: "Type", type: "select", options: o(["central", "substore", "pharmacy", "ot", "ward"]) }, { name: "isActive", label: "Active", type: "checkbox" }] },
  { id: "items", label: "Stock items", url: "/api/stock-items", defaults: { isActive: true, category: "drug", schedule: "", uom: "Nos", gstRate: 12 },
    cols: [{ key: "code", head: "Code" }, { key: "name", head: "Name" }, { key: "genericName", head: "Generic" }, { key: "schedule", head: "Schedule" },
      { key: "defaultMrp", head: "MRP", align: "right", render: (r) => money(r.defaultMrp) }, { key: "reorderLevel", head: "Reorder at", align: "right", render: (r) => Number(r.reorderLevel) }, active],
    fields: () => [{ name: "code", label: "Code", required: true }, { name: "name", label: "Name", required: true, span: 2 }, { name: "genericName", label: "Generic name" },
      { name: "drugClass", label: "Drug class", hint: "Used for allergy matching, e.g. Penicillin" },
      { name: "category", label: "Category", type: "select", options: o(["drug", "consumable", "surgical", "reagent", "implant", "other"]) },
      { name: "schedule", label: "Schedule", type: "select", options: o(DRUG_SCHEDULES) }, { name: "uom", label: "UoM" }, { name: "hsn", label: "HSN" },
      { name: "gstRate", label: "GST %", type: "select", options: o(GST_RATES) }, { name: "defaultMrp", label: "Default MRP", type: "number" },
      { name: "reorderLevel", label: "Reorder level", type: "number" }, { name: "reorderQty", label: "Reorder qty", type: "number" }, { name: "isActive", label: "Active", type: "checkbox" }],
    fromForm: (v) => ({ ...v, gstRate: Number(v.gstRate ?? 12), schedule: v.schedule ?? "" }) },
  { id: "suppliers", label: "Suppliers", url: "/api/suppliers", defaults: { isActive: true },
    cols: [{ key: "name", head: "Supplier" }, { key: "gstin", head: "GSTIN" }, { key: "drugLicenceNo", head: "Drug licence" }, { key: "phone", head: "Phone" }, active],
    fields: () => [{ name: "name", label: "Name", required: true, span: 2 }, { name: "gstin", label: "GSTIN" }, { name: "drugLicenceNo", label: "Drug licence no." },
      { name: "contactPerson", label: "Contact" }, { name: "phone", label: "Phone" }, { name: "email", label: "Email", type: "email" }, { name: "isActive", label: "Active", type: "checkbox" }] },
];

export default function Admin() {
  const { can } = useSession();
  const [tab, setTab] = useState("branches");
  const tabs = [...MASTERS.map((m) => ({ id: m.id, label: m.label })), { id: "doctors", label: "Doctors" }, { id: "beds", label: "Beds" },
    ...(can("users.manage") ? [{ id: "users", label: "Users" }] : []), ...(can("settings.write") ? [{ id: "settings", label: "Settings & licence" }] : [])];
  const m = MASTERS.find((x) => x.id === tab);
  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconAdmin size={14} /> Administration</span>}
        title="Masters & Users"
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <div className="page">
        {m && <MasterTable key={m.id} def={m} />}
        {tab === "doctors" && <Doctors />}
        {tab === "beds" && <Beds />}
        {tab === "users" && <Users />}
        {tab === "settings" && <Settings />}
      </div>
    </>
  );
}

function MasterTable({ def }: { def: MasterDef }) {
  const { lookups, refreshLookups, toast } = useSession();
  const { data, loading, reload } = useData<any[]>(def.url);
  const [edit, setEdit] = useState<any>(null);
  return (
    <Panel pad={false} title={def.label} actions={<button className="btn btn-primary small" onClick={() => setEdit({ ...def.defaults })} type="button"><IconPlus size={14} style={{ marginRight: 4 }} /> Add</button>}>
      <DataTable rows={data} loading={loading} cols={def.cols} onRow={(r) => setEdit(def.toForm ? def.toForm(r) : { ...r, gstRate: r.gstRate != null ? String(Number(r.gstRate)) : undefined })} />
      {edit && <FormDialog title={edit.id ? `Edit ${def.label.toLowerCase()}` : `Add to ${def.label.toLowerCase()}`} initial={edit} fields={def.fields(lookups)} onClose={() => setEdit(null)}
        submit={async (v) => {
          const body = def.fromForm ? def.fromForm(v) : v;
          if (edit.id) await api.put(`${def.url}/${edit.id}`, body); else await api.post(def.url, body);
          toast("Saved"); setEdit(null); void reload(); void refreshLookups();
        }} />}
    </Panel>
  );
}

function Doctors() {
  const { lookups, refreshLookups, toast } = useSession();
  const { data, reload } = useData<any[]>("/api/doctors");
  const users = useData<any[]>("/api/users");
  const [edit, setEdit] = useState<any>(null);
  const dept = (id: string) => lookups?.departments.find((d) => d.id === id)?.name;
  return (
    <Panel pad={false} title="Doctors" actions={<button className="btn btn-primary small" type="button"
      onClick={() => setEdit({ isActive: true, consultationFee: 0, followupFee: 0, schedule: [] })}><IconUserPlus size={14} style={{ marginRight: 4 }} /> Add doctor</button>}>
      <DataTable rows={data} onRow={(r) => setEdit({ ...r, schedule: r.schedule.map((s: any) => ({ ...s, fromTime: s.fromTime.slice(0, 5), toTime: s.toTime.slice(0, 5) })) })} cols={[
        { key: "code", head: "Code" }, { key: "fullName", head: "Name" }, { key: "dept", head: "Department", render: (r) => dept(r.departmentId) },
        { key: "consultationFee", head: "Fee", align: "right", render: (r) => money(r.consultationFee) },
        { key: "sessions", head: "Sessions/wk", align: "right", render: (r) => r.schedule.length }, active,
      ]} />
      {edit && <FormDialog wide title={edit.id ? `Edit ${edit.fullName}` : "Add doctor"} initial={edit} onClose={() => setEdit(null)} fields={[
        { name: "fullName", label: "Full name", required: true, span: 2 }, { name: "registrationNo", label: "Medical council reg. no." },
        { name: "departmentId", label: "Department", type: "select", required: true, options: opts(lookups?.departments, (d) => d.name) },
        { name: "branchId", label: "Branch", type: "select", required: true, options: opts(lookups?.branches, (b) => b.name) },
        { name: "userId", label: "Login account", type: "select", options: opts(users.data, (u) => u.email), hint: "Gets the Doctor role" },
        { name: "consultationFee", label: "Consultation fee", type: "number" }, { name: "followupFee", label: "Follow-up fee", type: "number" },
        { name: "consultationServiceId", label: "Billing service", type: "select", options: opts(lookups?.services.filter((s) => s.category === "consultation"), (s) => s.name) },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]} submit={async (v) => {
        if (edit.id) await api.put(`/api/doctors/${edit.id}`, v); else await api.post("/api/doctors", v);
        toast("Doctor saved"); setEdit(null); void reload(); void refreshLookups();
      }}>
        {(v, set) => <>
          <h5 style={{ margin: "18px 0 8px" }}>OPD schedule</h5>
          <LineEditor rows={v.schedule ?? []} setRows={(r) => set({ ...v, schedule: r })} blank={{ weekday: 1, fromTime: "09:00", toTime: "13:00", slotMinutes: 15, room: "" }} cols={[
            { key: "weekday", head: "Day", render: (r: any, s) => <select className="input" value={r.weekday} onChange={(e) => s({ weekday: Number(e.target.value) })}>
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select> },
            { key: "fromTime", head: "From", type: "time", width: "120px" }, { key: "toTime", head: "To", type: "time", width: "120px" },
            { key: "slotMinutes", head: "Slot (min)", type: "number", width: "100px" }, { key: "room", head: "Room", width: "110px" },
          ]} />
        </>}
      </FormDialog>}
    </Panel>
  );
}

function Beds() {
  const { lookups, toast } = useSession();
  const [wardId, setWardId] = useState("");
  const { data, reload } = useData<any[]>(wardId ? `/api/beds?wardId=${wardId}` : null);
  const [bedNo, setBedNo] = useState("");
  useEffect(() => { if (!wardId && lookups?.wards[0]) setWardId(lookups.wards[0].id); }, [lookups, wardId]);
  const add = async () => {
    try { await api.post("/api/beds", { wardId, bedNo }); setBedNo(""); toast("Bed added"); void reload(); } catch (e: any) { toast(e.message, "crit"); }
  };
  return (
    <Panel pad={false} title={<select className="input" style={{ maxWidth: 280 }} value={wardId} onChange={(e) => setWardId(e.target.value)}>
      {lookups?.wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>}
      actions={<div className="row gap-2"><input className="input" style={{ width: 120 }} placeholder="Bed no." value={bedNo} onChange={(e) => setBedNo(e.target.value)} />
        <button className="btn btn-primary small" disabled={!bedNo || !wardId} onClick={add} type="button"><IconPlus size={14} style={{ marginRight: 4 }} /> Add bed</button></div>}>
      <DataTable rows={data} cols={[{ key: "bedNo", head: "Bed" }, { key: "status", head: "Status", render: (r) => <Tag s={r.status} /> }]} />
    </Panel>
  );
}

function Users() {
  const { lookups, toast } = useSession();
  const { data, reload } = useData<any[]>("/api/users");
  const [edit, setEdit] = useState<any>(null);
  return (
    <Panel pad={false} title="Users" actions={<button className="btn btn-primary small" onClick={() => setEdit({ isActive: true, roles: [] })} type="button"><IconUserPlus size={14} style={{ marginRight: 4 }} /> Add user</button>}>
      <DataTable rows={data} onRow={(u) => setEdit({ ...u })} cols={[
        { key: "email", head: "Email" }, { key: "fullName", head: "Name" }, { key: "roles", head: "Roles", render: (u) => u.roles.map((r: string) => ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r).join(", ") },
        { key: "lastLoginAt", head: "Last sign-in", render: (u) => dt(u.lastLoginAt) }, active,
      ]} />
      {edit && <FormDialog title={edit.id ? `Edit ${edit.email}` : "Add user"} initial={edit} onClose={() => setEdit(null)} fields={[
        { name: "email", label: "Email", type: "email", required: true }, { name: "fullName", label: "Full name", required: true },
        { name: "branchId", label: "Branch", type: "select", options: opts(lookups?.branches, (b) => b.name) },
        { name: "roles", label: "Roles", type: "multi", span: 3, options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) },
        { name: "password", label: edit.id ? "New password (leave blank to keep)" : "Password", type: "password", required: !edit.id, hint: "10+ characters; changing it signs the user out everywhere" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]} submit={async (v) => {
        const body = { ...v }; if (!body.password) delete body.password;
        if (edit.id) await api.put(`/api/users/${edit.id}`, body); else await api.post("/api/users", body);
        toast("User saved"); setEdit(null); void reload();
      }} />}
    </Panel>
  );
}

function Settings() {
  const { toast } = useSession();
  const { data, reload } = useData<any>("/api/settings");
  const [v, setV] = useState<Record<string, any> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (data) setV({ ...data, licenceKey: data.licenceKey ?? "" }); }, [data]);
  if (!v) return null;
  const save = async () => {
    setErr(null);
    try { await api.put("/api/settings", { ...v, licenceKey: v.licenceKey === (data.licenceKey ?? "") ? undefined : v.licenceKey || null }); toast("Settings saved"); void reload(); }
    catch (e: any) { setErr(e.message); }
  };
  const lic = data.licence;
  return (
    <div className="grid-2">
      <Panel title="Hospital settings" actions={<button className="btn btn-primary small" onClick={save} type="button">Save</button>}>
        {err && <ErrorBox>{err}</ErrorBox>}
        <Fields value={v} onChange={setV} fields={[
          { name: "hospitalName", label: "Hospital name", required: true, span: 3 },
          { name: "discountApprovalThreshold", label: "Discount needing MS approval (%)", type: "number" },
          { name: "pharmacyMaxDiscount", label: "Max pharmacy discount (%)", type: "number" },
          { name: "minBedChargeDays", label: "Minimum bed-days billed", type: "number" },
          { name: "bedChargeGraceHours", label: "Bed-day grace hours", type: "number" },
          { name: "enforceLicence", label: "Enforce licence", type: "checkbox", hint: "Block transactions if the licence is missing or expired" },
          { name: "licenceKey", label: "Licence key (paste new key to replace)", type: "textarea", span: 3 },
        ]} />
      </Panel>
      <Panel title="Licence">
        <p><Tag s={data.licenceStatus} /></p>
        {lic ? <dl className="kv">
          <dt>Licensed to</dt><dd>{lic.customerName}</dd><dt>Contract</dt><dd>{lic.contract}</dd><dt>Plan</dt><dd>{lic.plan}</dd>
          <dt>Valid until</dt><dd>{lic.validUntil} (+{lic.graceDays} days grace)</dd><dt>Branches / users</dt><dd>{lic.maxBranches} / {lic.maxUsers}</dd>
          <dt>Modules</dt><dd>{lic.modules.map((m: string) => label(m)).join(", ")}</dd>
        </dl> : <p className="muted">No licence applied. Paste the key issued by Sevana into settings.</p>}
      </Panel>
    </div>
  );
}
