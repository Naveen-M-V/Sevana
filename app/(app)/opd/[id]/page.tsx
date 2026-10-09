"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheckCircle, IconFileText, IconOpd } from "@/components/icons";
import { AllergyBanner, LineEditor } from "@/components/domain";
import { ErrorBox, PageHead, Panel, Tag, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { dt } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

const VITALS: [string, string, string?][] = [
  ["bpSystolic", "BP systolic", "mmHg"], ["bpDiastolic", "BP diastolic", "mmHg"], ["pulse", "Pulse", "/min"], ["temperature", "Temp", "°F"],
  ["spo2", "SpO₂", "%"], ["respiratoryRate", "Resp. rate", "/min"], ["weight", "Weight", "kg"], ["height", "Height", "cm"],
];

type Rx = { itemId: string; dosage: string; durationDays: number | null; qty: number | null; instructions: string };
type Dx = { icdCode: string; description: string; type: string };

export default function Consultation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can, lookups, toast } = useSession();
  const { data: v, error, reload } = useData<any>(`/api/opd/${id}`);
  const [form, setForm] = useState<Record<string, any>>({});
  const [rx, setRx] = useState<Rx[]>([]);
  const [dx, setDx] = useState<Dx[]>([]);
  const [err, setErr] = useState<{ msg: string; code?: string } | null>(null);
  const { busy, run } = useAction(toast);

  useEffect(() => {
    if (!v) return;
    const f: Record<string, any> = {};
    for (const [k] of VITALS) f[k] = v[k];
    for (const k of ["chiefComplaint", "history", "examination", "advice", "followUpDate", "allergyOverrideReason"]) f[k] = v[k];
    setForm(f);
    setRx(v.prescription.map((r: any) => ({ itemId: r.itemId, dosage: r.dosage ?? "", durationDays: r.durationDays, qty: Number(r.qty), instructions: r.instructions ?? "" })));
    setDx(v.diagnoses.map((d: any) => ({ icdCode: d.icdCode ?? "", description: d.description, type: d.type })));
  }, [v]);

  if (error) return <div className="page"><ErrorBox>{error}</ErrorBox></div>;
  if (!v) return <div className="page muted">Loading…</div>;
  const open = !["completed", "cancelled"].includes(v.status);
  const clinician = can("opd.complete");
  const set = (k: string, val: any) => setForm({ ...form, [k]: val });

  const save = async (quiet = false) => {
    setErr(null);
    const body: Record<string, any> = {};
    for (const [k] of VITALS) body[k] = form[k] === "" ? null : form[k];
    body.chiefComplaint = form.chiefComplaint;
    if (clinician) {
      Object.assign(body, { history: form.history, examination: form.examination, advice: form.advice, followUpDate: form.followUpDate || null,
        allergyOverrideReason: form.allergyOverrideReason || null, diagnoses: dx.filter((d) => d.description.trim()),
        prescription: rx.filter((r) => r.itemId).map((r) => ({ ...r, qty: r.qty || null })) });
    }
    try {
      await api.put(`/api/opd/${id}`, body);
      if (!quiet) toast("Saved");
      return true;
    } catch (e: any) { setErr({ msg: e.message, code: e.code }); return false; }
  };
  const status = (s: string) => run(s, () => api.post(`/api/opd/${id}/status`, { status: s }), "Updated").then(() => reload());
  const complete = async () => {
    if (!(await save(true))) return;
    await run("complete", async () => {
      const r = await api.post(`/api/opd/${id}/complete`);
      toast(r.invoiceId ? "Visit completed; consultation invoice drafted" : "Visit completed");
      router.push("/opd");
    });
  };

  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconOpd size={14} /> {v.code} · Token {v.token} · {v.departmentName} · {v.doctorName}</span>}
        title={v.patient.fullName}
        actions={<>
          <Tag s={v.status} />
          {open && v.status !== "in_consultation" && clinician && <button className="btn btn-secondary" disabled={!!busy} onClick={() => status("in_consultation")} type="button">Start consultation</button>}
          {open && v.status === "waiting" && can("opd.write") && <button className="btn btn-secondary" disabled={!!busy} onClick={() => status("vitals")} type="button">To vitals</button>}
          {open && ["waiting", "vitals"].includes(v.status) && <button className="btn btn-ghost" disabled={!!busy} onClick={() => status("cancelled")} type="button">Cancel visit</button>}
          {open && <button className="btn btn-secondary" onClick={() => save()} type="button">Save</button>}
          {open && clinician && <button className="btn btn-primary" disabled={!!busy} onClick={complete} type="button"><IconCheckCircle size={14} style={{ marginRight: 6 }} /> Complete visit</button>}
          {v.invoiceId && can("invoice.read") && <button className="btn btn-secondary" onClick={() => router.push(`/billing/${v.invoiceId}`)} type="button"><IconFileText size={14} style={{ marginRight: 6 }} /> View invoice</button>}
        </>}>
        <div className="small muted" style={{ marginTop: 4 }}>
          {v.patient.mrn} · {v.patient.age} / {v.patient.gender}{v.patient.bloodGroup ? ` · ${v.patient.bloodGroup}` : ""} · arrived {dt(v.arrivedAt)}
          {v.patient.chronicConditions ? ` · ${v.patient.chronicConditions}` : ""}
        </div>
        <div style={{ marginTop: 10 }}><AllergyBanner allergies={v.patient.allergies} /></div>
      </PageHead>
      <div className="page">
        {err && <ErrorBox>{err.msg}</ErrorBox>}
        {err?.code === "allergy_conflict" && (
          <div className="alert alert-warn">To prescribe anyway, record a clinical override reason below; it will be audited.
            <input className="input" style={{ marginTop: 8 }} value={form.allergyOverrideReason ?? ""} onChange={(e) => set("allergyOverrideReason", e.target.value)}
              placeholder="e.g. Tolerated previously under supervision" /></div>
        )}
        <Panel title="Vitals">
          <div className="vitals">
            {VITALS.map(([k, l, u]) => (
              <div key={k} className="field"><label>{l} {u && <span className="muted">({u})</span>}</label>
                <input className="input" type="number" step="any" disabled={!open} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))} /></div>
            ))}
            <div className="field"><label>BMI</label><div className="input" style={{ background: "transparent" }}>{v.bmi ?? "—"}</div></div>
          </div>
        </Panel>
        <div className="grid-2">
          <Panel title="Clinical notes">
            <div className="field"><label>Chief complaint</label><textarea className="input" disabled={!open} value={form.chiefComplaint ?? ""} onChange={(e) => set("chiefComplaint", e.target.value)} /></div>
            {clinician && <>
              <div className="field"><label>History</label><textarea className="input" disabled={!open} value={form.history ?? ""} onChange={(e) => set("history", e.target.value)} /></div>
              <div className="field"><label>Examination</label><textarea className="input" disabled={!open} value={form.examination ?? ""} onChange={(e) => set("examination", e.target.value)} /></div>
              <div className="field"><label>Advice</label><textarea className="input" disabled={!open} value={form.advice ?? ""} onChange={(e) => set("advice", e.target.value)} /></div>
              <div className="field" style={{ maxWidth: 220 }}><label>Follow-up date</label><input className="input" type="date" disabled={!open} value={form.followUpDate ?? ""} onChange={(e) => set("followUpDate", e.target.value)} /></div>
            </>}
          </Panel>
          {clinician && <Panel title="Diagnosis">
            <LineEditor rows={dx} setRows={setDx} blank={{ icdCode: "", description: "", type: "provisional" }} cols={[
              { key: "icdCode", head: "ICD-10", width: "110px" },
              { key: "description", head: "Description" },
              { key: "type", head: "Type", width: "130px", render: (r, s) => <select className="input" value={r.type} onChange={(e) => s({ type: e.target.value })}>
                <option value="provisional">Provisional</option><option value="final">Final</option></select> },
            ]} />
          </Panel>}
        </div>
        {clinician && <Panel title="Prescription">
          <p className="small muted" style={{ marginTop: 0 }}>Dosage as morning-noon-night (e.g. 1-0-1); quantity is calculated from days when left blank. Drugs are checked against recorded allergies on save.</p>
          <LineEditor rows={rx} setRows={setRx} blank={{ itemId: "", dosage: "", durationDays: null, qty: null, instructions: "" }} cols={[
            { key: "itemId", head: "Drug", render: (r, s) => <select className="input" value={r.itemId} onChange={(e) => s({ itemId: e.target.value })}>
              <option value="">—</option>{lookups?.items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.schedule && i.schedule !== "OTC" ? ` [${i.schedule}]` : ""}</option>)}</select> },
            { key: "dosage", head: "Dosage", width: "110px" },
            { key: "durationDays", head: "Days", width: "80px", type: "number" },
            { key: "qty", head: "Qty", width: "90px", type: "number" },
            { key: "instructions", head: "Instructions" },
          ]} />
        </Panel>}
      </div>
    </>
  );
}
