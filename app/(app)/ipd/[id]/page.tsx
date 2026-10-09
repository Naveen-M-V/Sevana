"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeftRight, IconBed, IconCheckCircle, IconFileText, IconPlus } from "@/components/icons";
import { AllergyBanner } from "@/components/domain";
import { DataTable, Dialog, ErrorBox, FormDialog, opts, PageHead, Panel, Tag, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { date, dt, money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

export default function Admission({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can, lookups, toast } = useSession();
  const { data: a, error, reload } = useData<any>(`/api/admissions/${id}`);
  const [dlg, setDlg] = useState<"charge" | "transfer" | "discharge" | null>(null);
  const [notes, setNotes] = useState<{ provisionalDiagnosis?: string; dischargeSummary?: string }>({});
  const { busy, run } = useAction(toast);
  useEffect(() => { if (a) setNotes({ provisionalDiagnosis: a.provisionalDiagnosis ?? "", dischargeSummary: a.dischargeSummary ?? "" }); }, [a]);
  if (error) return <div className="page"><ErrorBox>{error}</ErrorBox></div>;
  if (!a) return <div className="page muted">Loading…</div>;
  const open = ["admitted", "discharge_initiated"].includes(a.status);
  const w = can("ipd.write") && open;
  const current = a.movements.find((m: any) => !m.toAt);

  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconBed size={14} /> {a.code} · {a.admissionType} · {a.doctorName}</span>}
        title={a.patient.fullName}
        actions={<>
          <Tag s={a.status} />
          {w && <button className="btn btn-secondary" onClick={() => setDlg("charge")} type="button"><IconPlus size={14} style={{ marginRight: 6 }} /> Add charge</button>}
          {w && <button className="btn btn-secondary" onClick={() => setDlg("transfer")} type="button"><IconArrowLeftRight size={14} style={{ marginRight: 6 }} /> Transfer bed</button>}
          {w && a.status === "admitted" && <button className="btn btn-secondary" disabled={!!busy}
            onClick={() => run("init", () => api.post(`/api/admissions/${id}/initiate-discharge`), "Discharge initiated").then(() => reload())} type="button">Initiate discharge</button>}
          {w && <button className="btn btn-primary" onClick={() => setDlg("discharge")} type="button"><IconCheckCircle size={14} style={{ marginRight: 6 }} /> Discharge</button>}
          {a.invoiceId && <button className="btn btn-secondary" onClick={() => router.push(`/billing/${a.invoiceId}`)} type="button"><IconFileText size={14} style={{ marginRight: 6 }} /> Final bill</button>}
        </>}>
        <div className="small muted" style={{ marginTop: 4 }}>{a.patient.mrn} · {a.patient.age} / {a.patient.gender} · admitted {dt(a.admittedAt)}
          {current ? ` · now in ${current.wardName} ${current.bedNo}` : ""}{a.expectedDischarge ? ` · EDD ${date(a.expectedDischarge)}` : ""}</div>
        <div style={{ marginTop: 10 }}><AllergyBanner allergies={a.patient.allergies} /></div>
      </PageHead>
      <div className="page">
        <div className="grid-2">
          <Panel title="Bed history" pad={false}>
            <DataTable rows={a.movements} cols={[
              { key: "ward", head: "Ward / bed", render: (m: any) => `${m.wardName} · ${m.bedNo}` }, { key: "fromAt", head: "From", render: (m: any) => dt(m.fromAt) },
              { key: "toAt", head: "To", render: (m: any) => m.toAt ? dt(m.toAt) : <Tag s="occupied">current</Tag> },
              { key: "dailyTariff", head: "Tariff", align: "right", render: (m: any) => money(m.dailyTariff) },
            ]} />
          </Panel>
          <Panel title="Charges posted" pad={false}>
            <DataTable rows={a.charges} empty="No charges yet. Bed charges are computed at discharge." cols={[
              { key: "serviceName", head: "Service" }, { key: "qty", head: "Qty", align: "right", render: (c: any) => Number(c.qty) },
              { key: "rate", head: "Rate", align: "right", render: (c: any) => money(c.rate) }, { key: "createdAt", head: "When", render: (c: any) => dt(c.createdAt) },
              { key: "billed", head: "", render: (c: any) => c.billed ? <Tag s="completed">billed</Tag> : null },
            ]} />
          </Panel>
        </div>
        <Panel title="Clinical summary" actions={w && <button className="btn btn-secondary small" type="button"
          onClick={() => run("notes", () => api.put(`/api/admissions/${id}/notes`, notes), "Saved")}>Save</button>}>
          <div className="field"><label>Provisional diagnosis</label><input className="input" disabled={!w} value={notes.provisionalDiagnosis ?? ""} onChange={(e) => setNotes({ ...notes, provisionalDiagnosis: e.target.value })} /></div>
          <div className="field" style={{ marginTop: 10 }}><label>Discharge summary</label><textarea className="input" style={{ minHeight: 140 }} disabled={!w} value={notes.dischargeSummary ?? ""}
            onChange={(e) => setNotes({ ...notes, dischargeSummary: e.target.value })} /></div>
          <p className="small muted">Reason: {a.reason}</p>
        </Panel>
      </div>
      {dlg === "charge" && <FormDialog title="Add charge" onClose={() => setDlg(null)} initial={{ qty: 1 }} fields={[
        { name: "serviceId", label: "Service", type: "select", required: true, span: 2, options: opts(lookups?.services, (s) => `${s.name} · ${money(s.rate)}`) },
        { name: "qty", label: "Qty", type: "number", required: true }, { name: "remarks", label: "Remarks", span: 3 },
      ]} submit={async (v) => { await api.post(`/api/admissions/${id}/charges`, v); toast("Charge posted"); setDlg(null); void reload(); }} />}
      {dlg === "transfer" && <TransferDialog id={id} onClose={() => setDlg(null)} onDone={() => { setDlg(null); void reload(); }} />}
      {dlg === "discharge" && <FormDialog title="Discharge patient" submitLabel="Discharge & raise bill" onClose={() => setDlg(null)}
        initial={{ type: "routine", summary: notes.dischargeSummary }} fields={[
          { name: "type", label: "Discharge type", type: "select", required: true, options: [{ value: "routine", label: "Routine" }, { value: "lama", label: "LAMA" }, { value: "referred", label: "Referred" }, { value: "death", label: "Death" }] },
          { name: "summary", label: "Discharge summary (required for routine)", type: "textarea", span: 3 },
        ]} submit={async (v) => { const r = await api.post(`/api/admissions/${id}/discharge`, v); toast("Discharged; final bill drafted"); router.push(r.invoiceId ? `/billing/${r.invoiceId}` : "/ipd"); }} />}
    </>
  );
}

function TransferDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useSession();
  const { data } = useData<any[]>("/api/ipd/bed-board");
  const [bedId, setBedId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    try { await api.post(`/api/admissions/${id}/transfer`, { bedId }); toast("Transferred"); onDone(); } catch (e: any) { setErr(e.message); }
  };
  return (
    <Dialog title="Transfer to bed" onClose={onClose} actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
      <button className="btn btn-primary" disabled={!bedId} onClick={save} type="button">Transfer</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <select className="input" value={bedId} onChange={(e) => setBedId(e.target.value)}>
        <option value="">Select an available bed</option>
        {data?.map((w) => <optgroup key={w.id} label={`${w.name} · ${money(w.dailyTariff)}/day`}>
          {w.beds.filter((b: any) => b.status === "available").map((b: any) => <option key={b.id} value={b.id}>{b.bedNo}</option>)}</optgroup>)}
      </select>
    </Dialog>
  );
}
