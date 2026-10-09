"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientPicker, type PatientLite } from "@/components/domain";
import { DataTable, Dialog, ErrorBox, PageHead, Panel, Tabs, Tag } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { date, money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

import { IconBilling, IconPlus, IconSearch } from "@/components/icons";

const TABS = [{ id: "", label: "All" }, { id: "draft", label: "Draft" }, { id: "unpaid,partly_paid", label: "Outstanding" }, { id: "paid", label: "Paid" }, { id: "cancelled", label: "Cancelled" }];

function Billing() {
  const router = useRouter();
  const params = useSearchParams();
  const { can } = useSession();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, loading } = useData<any[]>(`/api/invoices${qs({ status, q: q.length >= 2 ? q : undefined })}`);
  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconBilling size={14} /> Revenue & Claims
          </span>
        }
        title="Billing"
        actions={
          can("invoice.write") && (
            <button className="btn btn-primary" onClick={() => setCreating(true)} type="button">
              <IconPlus size={16} />
              <span>New Invoice</span>
            </button>
          )
        }
      />
      <Tabs tabs={TABS} value={status} onChange={setStatus} />
      <div className="page">
        <Panel
          pad={false}
          title={
            <div style={{ position: "relative", maxWidth: 380, width: "100%" }}>
              <IconSearch size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Invoice no., patient or MRN…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          }
        >
          <DataTable rows={data} loading={loading} onRow={(i: any) => router.push(`/billing/${i.id}`)} cols={[
            { key: "code", head: "Invoice", render: (i: any) => <span className="mono strong">{i.code}</span> }, { key: "postingDate", head: "Date", render: (i: any) => date(i.postingDate) },
            { key: "patientName", head: "Patient", render: (i: any) => <>{i.patientName} <span className="muted small">{i.mrn}</span></> },
            { key: "invoiceType", head: "Type" }, { key: "payerType", head: "Payer" },
            { key: "grandTotal", head: "Total", align: "right", render: (i: any) => money(i.grandTotal) },
            { key: "outstandingAmount", head: "Due", align: "right", render: (i: any) => money(i.outstandingAmount) },
            { key: "status", head: "Status", render: (i: any) => <Tag s={i.status} /> },
          ]} />
        </Panel>
      </div>
      {creating && <NewInvoice onClose={() => setCreating(false)} onDone={(id) => router.push(`/billing/${id}`)} />}
    </>
  );
}

function NewInvoice({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const { lookups, me } = useSession();
  const [p, setP] = useState<PatientLite | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    try {
      if (!p || !serviceId) throw new Error("Select a patient and a first charge");
      const inv = await api.post("/api/invoices", { patientId: p.id, branchId: me?.branchId ?? lookups?.branches[0]?.id, invoiceType: "other", items: [{ serviceId }] });
      onDone(inv.id);
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Dialog title="New invoice" onClose={onClose} actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
      <button className="btn btn-primary" onClick={save} type="button">Create draft</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="field"><label>Patient</label><PatientPicker value={p} onChange={setP} autoFocus /></div>
      <div className="field" style={{ marginTop: 12 }}><label>First charge</label><select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
        <option value="">—</option>{lookups?.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {money(s.rate)}</option>)}</select></div>
      <p className="small muted">You can add more lines on the next screen.</p>
    </Dialog>
  );
}
export default function Page() { return <Suspense><Billing /></Suspense>; }
