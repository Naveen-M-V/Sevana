"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientPicker, type PatientLite } from "@/components/domain";
import { DataTable, Dialog, ErrorBox, Kpis, PageHead, Panel, Tabs, Tag, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { dt, money } from "@/lib/format";
import { useData, useEvents } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { IconBed, IconCheckCircle, IconClock, IconAlertTriangle } from "@/components/icons";

const BED_C: Record<string, string> = { available: "var(--st-ok)", occupied: "var(--st-crit-solid)", reserved: "var(--st-pend)", cleaning: "var(--st-warn)", maintenance: "var(--st-inactive)" };

export default function Ipd() {
  const router = useRouter();
  const { can, toast } = useSession();
  const [tab, setTab] = useState("board");
  const board = useData<any[]>("/api/ipd/bed-board");
  const adms = useData<any[]>("/api/admissions?status=admitted,discharge_initiated");
  useEvents(["bed"], () => { void board.reload(); void adms.reload(); });
  const [admit, setAdmit] = useState<{ wardId: string; bedId: string; label: string } | null>(null);
  const [bedMenu, setBedMenu] = useState<any>(null);
  const { run } = useAction(toast);
  const all = board.data?.flatMap((w) => w.beds) ?? [];
  const count = (s: string) => all.filter((b) => b.status === s).length;

  const clickBed = (w: any, b: any) => {
    if (b.status === "occupied" && b.currentAdmissionId) router.push(`/ipd/${b.currentAdmissionId}`);
    else if (b.status === "available" && can("ipd.write")) setAdmit({ wardId: w.id, bedId: b.id, label: `${w.name} · ${b.bedNo}` });
    else if (can("bed.write")) setBedMenu(b);
  };
  const setStatus = async (status: string) => {
    if (await run("bed", () => api.post(`/api/beds/${bedMenu.id}/status`, { status }), `Bed ${bedMenu.bedNo} → ${status}`)) { setBedMenu(null); void board.reload(); }
  };
  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconBed size={14} /> Inpatient Care
          </span>
        }
        title="Bed Board & Admissions"
      />
      <Kpis items={[
        { label: "Total Beds", value: all.length, icon: <IconBed size={18} /> },
        { label: "Occupied", value: count("occupied"), sub: all.length ? `${Math.round((count("occupied") / all.length) * 100)}% occupancy` : "", tone: "crit", icon: <IconBed size={18} /> },
        { label: "Available", value: count("available"), tone: "ok", sub: "ready to admit", icon: <IconCheckCircle size={18} /> },
        { label: "Cleaning", value: count("cleaning"), tone: "warn", sub: "turnover", icon: <IconClock size={18} /> },
        { label: "Reserved / Maintenance", value: count("reserved") + count("maintenance"), icon: <IconAlertTriangle size={18} /> },
      ]} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "board", label: "Bed board" }, { id: "list", label: "Current admissions", count: adms.data?.length }]} />
      <div className="page">
        {tab === "board" && board.data?.map((w) => (
          <div key={w.id} className="ward">
            <div className="ward-head"><h4>{w.name}</h4><span className="muted small">{w.wardType} · {w.floor ?? ""} · {money(w.dailyTariff)}/day · {w.occupied}/{w.beds.length} occupied</span></div>
            <div className="beds">
              {w.beds.map((b: any) => (
                <button key={b.id} className="bed" style={{ ["--bed-c" as any]: BED_C[b.status] }} onClick={() => clickBed(w, b)} type="button">
                  <div className="row"><span className="bed-no grow">{b.bedNo}</span><Tag s={b.status} /></div>
                  <div className="small ellipsis" style={{ marginTop: 6 }}>{b.patientName ?? (b.status === "available" ? <span className="muted">Admit →</span> : "")}</div>
                  {b.admissionCode && <div className="small muted">{b.admissionCode}</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {tab === "list" && <Panel pad={false}>
          <DataTable rows={adms.data} onRow={(a: any) => router.push(`/ipd/${a.id}`)} cols={[
            { key: "code", head: "IP no.", render: (a: any) => <span className="strong mono">{a.code}</span> }, { key: "patientName", head: "Patient" },
            { key: "bed", head: "Bed", render: (a: any) => `${a.wardName ?? ""} ${a.bedNo ?? ""}` }, { key: "doctorName", head: "Consultant" },
            { key: "admittedAt", head: "Admitted", render: (a: any) => dt(a.admittedAt) }, { key: "status", head: "Status", render: (a: any) => <Tag s={a.status} /> },
          ]} />
        </Panel>}
      </div>
      {admit && <AdmitDialog {...admit} onClose={() => setAdmit(null)} onDone={(id) => router.push(`/ipd/${id}`)} />}
      {bedMenu && <Dialog title={`Bed ${bedMenu.bedNo}: ${bedMenu.status}`} onClose={() => setBedMenu(null)}>
        <p className="muted">Set housekeeping status.</p>
        <div className="row gap-2 wrap">{["available", "cleaning", "maintenance", "reserved"].filter((s) => s !== bedMenu.status).map((s) =>
          <button key={s} className="btn btn-secondary" onClick={() => setStatus(s)} type="button">Mark {s}</button>)}</div>
      </Dialog>}
    </>
  );
}

function AdmitDialog({ wardId, bedId, label, onClose, onDone }: { wardId: string; bedId: string; label: string; onClose: () => void; onDone: (id: string) => void }) {
  const { lookups, toast } = useSession();
  const [p, setP] = useState<PatientLite | null>(null);
  const [f, setF] = useState<Record<string, any>>({ admissionType: "elective" });
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    setErr(null);
    try {
      if (!p) throw new Error("Select a patient");
      const a = await api.post("/api/admissions", { ...f, patientId: p.id, wardId, bedId });
      toast(`Admitted: ${a.code}`); onDone(a.id);
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Dialog title={`Admit to ${label}`} onClose={onClose}
      actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button><button className="btn btn-primary" onClick={save} type="button">Admit</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="field"><label>Patient</label><PatientPicker value={p} onChange={setP} autoFocus /></div>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="field" style={{ gridColumn: "span 2" }}><label>Admitting consultant *</label><select className="input" value={f.doctorId ?? ""} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>
          <option value="">—</option>{lookups?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="field"><label>Type</label><select className="input" value={f.admissionType} onChange={(e) => setF({ ...f, admissionType: e.target.value })}>
          {["elective", "emergency", "transfer_in", "daycare"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}</select></div>
        <div className="field" style={{ gridColumn: "span 3" }}><label>Reason for admission *</label><input className="input" value={f.reason ?? ""} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        <div className="field" style={{ gridColumn: "span 2" }}><label>Provisional diagnosis</label><input className="input" value={f.provisionalDiagnosis ?? ""} onChange={(e) => setF({ ...f, provisionalDiagnosis: e.target.value })} /></div>
        <div className="field"><label>Expected discharge</label><input className="input" type="date" value={f.expectedDischarge ?? ""} onChange={(e) => setF({ ...f, expectedDischarge: e.target.value || null })} /></div>
      </div>
    </Dialog>
  );
}
