"use client";
import { useEffect, useMemo, useState } from "react";
import { LineEditor, PatientPicker, type PatientLite } from "@/components/domain";
import { DataTable, ErrorBox, PageHead, Panel, Tabs, Tag, useAction } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { date, dt, money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { IconPharmacy, IconChevronRight } from "@/components/icons";

type Line = { itemId: string; qty: number; batchId: string | null };

export default function Pharmacy() {
  const { lookups, can, toast } = useSession();
  const [tab, setTab] = useState("counter");
  const [storeId, setStoreId] = useState("");
  const rx = useData<any[]>("/api/opd/e-prescriptions");
  const sales = useData<any[]>(tab === "sales" ? "/api/pharmacy/sales" : null, [tab]);
  const pharmacies = lookups?.stores.filter((s) => s.storeType === "pharmacy") ?? [];
  useEffect(() => { if (!storeId && pharmacies[0]) setStoreId(pharmacies[0].id); }, [pharmacies, storeId]);

  // POS state
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [visit, setVisit] = useState<{ id: string; code: string } | null>(null);
  const [doctor, setDoctor] = useState("");
  const [mode, setMode] = useState("cash");
  const [admissionId, setAdmissionId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<Line[]>([{ itemId: "", qty: 1, batchId: null }]);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const { busy, run } = useAction(toast);
  const adms = useData<any[]>(mode === "ip_account" ? "/api/admissions?status=admitted,discharge_initiated" : null, [mode]);

  const restricted = useMemo(() => lines.some((l) => ["H1", "X"].includes(lookups?.items.find((i) => i.id === l.itemId)?.schedule ?? "")), [lines, lookups]);
  const reset = () => { setPatient(null); setCustomerName(""); setVisit(null); setDoctor(""); setMode("cash"); setAdmissionId(""); setDiscount(0); setLines([{ itemId: "", qty: 1, batchId: null }]); };

  const loadRx = async (r: any) => {
    try {
      const d = await api.get(`/api/pharmacy/prescription/${r.id}${qs({ storeId })}`);
      setVisit({ id: r.id, code: r.code });
      setPatient({ id: d.patientId, fullName: r.patientName, mrn: "" });
      setDoctor(d.prescribingDoctor);
      setLines(d.items.map((i: any) => ({ itemId: i.itemId, qty: i.qty, batchId: null })));
      setTab("counter");
      const short = d.items.filter((i: any) => i.available != null && i.available < i.qty);
      if (short.length) toast(`Short in this store: ${short.map((s: any) => `${s.itemName} (${s.available}/${s.qty})`).join(", ")}`, "crit");
    } catch (e: any) { toast(e.message, "crit"); }
  };

  const sell = async () => {
    setErr(null);
    await run("sell", async () => {
      try {
        const s = await api.post("/api/pharmacy/sales", { storeId, patientId: patient?.id ?? null, customerName: patient ? null : customerName,
          opdVisitId: visit?.id ?? null, prescribingDoctor: doctor || null, paymentMode: mode, admissionId: mode === "ip_account" ? admissionId : null,
          discountPercent: discount, items: lines.filter((l) => l.itemId) });
        setLast(s); reset(); void rx.reload();
        toast(`Sale ${s.code}: ${money(s.netPayable)}`);
      } catch (e: any) { setErr(e.message); throw e; }
    });
  };
  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconPharmacy size={14} /> Dispensation & Counter POS
          </span>
        }
        title="Pharmacy"
        actions={
          <select className="input" style={{ minWidth: 220 }} value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store">
            {pharmacies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        }
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "counter", label: "Counter sale" }, { id: "rx", label: "E-prescriptions", count: rx.data?.length }, { id: "sales", label: "Recent sales" }]} />
      <div className="page">
        {tab === "rx" && <Panel pad={false}>
          <DataTable rows={rx.data} empty="No pending prescriptions." onRow={loadRx} cols={[
            { key: "visitDate", head: "Date", render: (r: any) => date(r.visitDate) }, { key: "code", head: "Visit" }, { key: "token", head: "Token" },
            { key: "patientName", head: "Patient" }, { key: "doctorName", head: "Doctor" },
            { key: "prescriptionStatus", head: "Status", render: (r: any) => <Tag s={r.prescriptionStatus} /> },
            { key: "x", head: "", render: () => (
              <span className="btn btn-ghost small" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Dispense <IconChevronRight size={14} />
              </span>
            ) },
          ]} />
        </Panel>}

        {tab === "counter" && <div className="grid-side">
          <Panel title={visit ? `Dispensing ${visit.code}` : "New sale"} actions={visit && <button className="btn btn-ghost small" onClick={reset} type="button">Clear</button>}>
            {err && <ErrorBox>{err}</ErrorBox>}
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "span 2" }}><label>Patient</label><PatientPicker value={patient} onChange={(p) => { setPatient(p); if (!p) setVisit(null); }} /></div>
              {!patient && <div className="field"><label>or walk-in name</label><input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>}
              <div className="field"><label>Payment</label><select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="ip_account">Bill to IP account</option></select></div>
              {mode === "ip_account" && <div className="field" style={{ gridColumn: "span 2" }}><label>Admission</label><select className="input" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)}>
                <option value="">—</option>{adms.data?.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.patientName} · {a.wardName} {a.bedNo}</option>)}</select></div>}
              <div className="field"><label>Discount %</label><input className="input" type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
              <div className="field" style={{ gridColumn: "span 2" }}><label>Prescribing doctor {restricted && !visit && "*"}</label>
                <input className="input" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder={restricted ? "Required for Schedule H1 / X" : ""} /></div>
            </div>
            {restricted && !visit && !doctor && <div className="alert alert-warn" style={{ marginTop: 12 }}>A Schedule H1/X drug is on this bill: link the prescription or record the prescribing doctor.</div>}
            <div style={{ marginTop: 14 }}>
              <LineEditor rows={lines} setRows={setLines} blank={{ itemId: "", qty: 1, batchId: null }} cols={[
                { key: "itemId", head: "Item", render: (r, s) => <select className="input" value={r.itemId} onChange={(e) => s({ itemId: e.target.value, batchId: null })}>
                  <option value="">—</option>{lookups?.items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.schedule && i.schedule !== "OTC" ? ` [${i.schedule}]` : ""}</option>)}</select> },
                { key: "batchId", head: "Batch", width: "220px", render: (r, s) => <BatchSelect itemId={r.itemId} storeId={storeId} value={r.batchId} onChange={(b) => s({ batchId: b })} /> },
                { key: "qty", head: "Qty", width: "90px", type: "number" },
              ]} />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <div className="grow small muted">Prices are MRP (GST-inclusive). Batches default to first-expiry-first-out.</div>
              <button className="btn btn-primary" disabled={!!busy || !can("pharmacy.sell")} onClick={sell} type="button">{busy ? "Posting…" : "Complete sale"}</button>
            </div>
          </Panel>
          <Panel title="Last sale">
            {!last && <p className="muted">Completed sales appear here for printing the bill.</p>}
            {last && <>
              <div className="strong">{last.code}</div>
              <table className="table" style={{ marginTop: 8 }}><tbody>
                {last.items.map((i: any, k: number) => <tr key={k}><td>{lookups?.items.find((x) => x.id === i.itemId)?.name}</td><td className="right">{i.qty}</td><td className="right">{money(i.amount)}</td></tr>)}
              </tbody></table>
              <div className="totals" style={{ marginTop: 8 }}>
                <div><span>MRP total</span><span>{money(last.mrpTotal)}</span></div>
                <div><span>Discount</span><span>− {money(last.discountAmount)}</span></div>
                <div><span>incl. GST</span><span>{money(last.gstIncluded)}</span></div>
                <div className="grand"><span>Net</span><span>{money(last.netPayable)}</span></div>
              </div>
            </>}
          </Panel>
        </div>}

        {tab === "sales" && <Panel pad={false}>
          <DataTable rows={sales.data} loading={sales.loading} cols={[
            { key: "code", head: "Bill", render: (s: any) => <span className="mono strong">{s.code}</span> }, { key: "createdAt", head: "When", render: (s: any) => dt(s.createdAt) },
            { key: "patientName", head: "Patient / customer", render: (s: any) => s.patientName ?? "—" }, { key: "paymentMode", head: "Payment" },
            { key: "netPayable", head: "Net", align: "right", render: (s: any) => money(s.netPayable) }, { key: "status", head: "Status", render: (s: any) => <Tag s={s.status} /> },
            { key: "x", head: "", render: (s: any) => s.status === "posted" && can("pharmacy.cancel") ? <button className="btn btn-ghost small" type="button"
              onClick={() => window.confirm(`Cancel ${s.code}? Stock will be returned.`) && run("c", () => api.post(`/api/pharmacy/sales/${s.id}/cancel`), "Sale cancelled; stock restored").then(() => sales.reload())}>Cancel</button> : null },
          ]} />
        </Panel>}
      </div>
    </>
  );
}

function BatchSelect({ itemId, storeId, value, onChange }: { itemId: string; storeId: string; value: string | null; onChange: (b: string | null) => void }) {
  const { data } = useData<any[]>(itemId && storeId ? `/api/stock/items/${itemId}/batches${qs({ storeId })}` : null);
  return (
    <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={!itemId}>
      <option value="">Auto (FEFO){data ? ` · ${data.reduce((a, b) => a + Number(b.qty), 0)} in stock` : ""}</option>
      {data?.map((b) => <option key={b.batchId} value={b.batchId}>{b.batchNo} · exp {date(b.expiryDate)} · {Number(b.qty)} · {money(b.mrp)}</option>)}
    </select>
  );
}
