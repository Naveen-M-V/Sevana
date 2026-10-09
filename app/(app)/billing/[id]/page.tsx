"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_MODES, REF_REQUIRED_MODES, label } from "@sevana/shared";
import { IconBilling, IconCheckCircle, IconCreditCard, IconUser } from "@/components/icons";
import { LineEditor } from "@/components/domain";
import { DataTable, ErrorBox, FormDialog, PageHead, Panel, Tag, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { dt, money, date } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

type Line = { serviceId: string | null; description: string; qty: number; rate: number | null };

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can, lookups, toast, me } = useSession();
  const { data: inv, error, reload } = useData<any>(`/api/invoices/${id}`);
  const [lines, setLines] = useState<Line[]>([]);
  const [disc, setDisc] = useState({ discountPercent: 0, discountReason: "" });
  const [paying, setPaying] = useState(false);
  const { busy, run } = useAction(toast);
  useEffect(() => {
    if (!inv) return;
    setLines(inv.items.map((i: any) => ({ serviceId: i.serviceId, description: i.description, qty: Number(i.qty), rate: Number(i.rate) })));
    setDisc({ discountPercent: Number(inv.discountPercent), discountReason: inv.discountReason ?? "" });
  }, [inv]);
  if (error) return <div className="page"><ErrorBox>{error}</ErrorBox></div>;
  if (!inv) return <div className="page muted">Loading…</div>;
  const draft = inv.status === "draft";
  const editable = draft && can("invoice.write");
  const needsApproval = disc.discountPercent > inv.approvalThreshold;
  const approved = inv.discountApprovedBy && Number(inv.approvedDiscountPercent) >= Number(inv.discountPercent);

  const saveDraft = () => run("save", async () => {
    await api.put(`/api/invoices/${id}`, { patientId: inv.patientId, branchId: inv.branchId, invoiceType: inv.invoiceType, payerType: inv.payerType,
      insurer: inv.insurer, preAuthNo: inv.preAuthNo, ...disc, items: lines.map((l) => ({ ...l, rate: l.rate ?? undefined })) });
    await reload();
  }, "Draft saved");

  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconBilling size={14} /> {inv.invoiceType.toUpperCase()} Invoice · {date(inv.postingDate)} · {inv.payerType}{inv.insurer ? ` (${inv.insurer})` : ""}</span>}
        title={<>{inv.code} <span className="muted" style={{ fontWeight: 400 }}>· {inv.patientName}</span></>}
        actions={<>
          <Tag s={inv.status} />
          {editable && <button className="btn btn-secondary" disabled={!!busy} onClick={saveDraft} type="button">Save draft</button>}
          {draft && Number(inv.discountPercent) > 0 && !approved && can("discount.approve") && inv.createdBy !== me?.id &&
            <button className="btn btn-secondary" disabled={!!busy} onClick={() => run("appr", () => api.post(`/api/invoices/${id}/approve-discount`), "Discount approved").then(() => reload())} type="button">Approve {Number(inv.discountPercent)}% discount</button>}
          {draft && can("invoice.finalize") && <button className="btn btn-primary" disabled={!!busy}
            onClick={() => run("fin", () => api.post(`/api/invoices/${id}/finalize`), "Invoice finalised").then(() => reload())} type="button"><IconCheckCircle size={14} style={{ marginRight: 6 }} /> Finalise</button>}
          {["unpaid", "partly_paid"].includes(inv.status) && can("payment.collect") && <button className="btn btn-primary" onClick={() => setPaying(true)} type="button"><IconCreditCard size={14} style={{ marginRight: 6 }} /> Collect payment</button>}
          {inv.status !== "cancelled" && can("invoice.cancel") && <button className="btn btn-ghost" disabled={!!busy}
            onClick={() => window.confirm("Cancel this invoice?") && run("cancel", () => api.post(`/api/invoices/${id}/cancel`), "Cancelled").then(() => reload())} type="button">Cancel invoice</button>}
          <button className="btn btn-ghost" onClick={() => router.push(`/patients/${inv.patientId}`)} type="button"><IconUser size={14} style={{ marginRight: 6 }} /> Patient</button>
        </>}
      />
      <div className="page">
        {draft && needsApproval && (
          <div className={`alert ${approved ? "alert-ok" : "alert-warn"}`}>
            {approved ? `Discount of ${Number(inv.approvedDiscountPercent)}% approved by ${inv.approverName}.`
              : `A discount above ${inv.approvalThreshold}% needs Medical Superintendent approval before finalising. Save the draft, then ask the MS to approve.`}
          </div>)}
        <Panel title="Charges" pad={!editable}>
          {editable ? (
            <div style={{ padding: 16 }}>
              <LineEditor rows={lines} setRows={setLines} blank={{ serviceId: null, description: "", qty: 1, rate: null }} cols={[
                { key: "serviceId", head: "Service", render: (r, s) => <select className="input" value={r.serviceId ?? ""} onChange={(e) => {
                  const svc = lookups?.services.find((x) => x.id === e.target.value);
                  s({ serviceId: e.target.value || null, description: svc?.name ?? r.description, rate: svc ? Number(svc.rate) : r.rate });
                }}><option value="">Ad-hoc</option>{lookups?.services.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
                { key: "description", head: "Description" }, { key: "qty", head: "Qty", width: "90px", type: "number" }, { key: "rate", head: "Rate", width: "120px", type: "number" },
              ]} />
              <div className="form-grid" style={{ marginTop: 16, maxWidth: 640 }}>
                <div className="field"><label>Discount %</label><input className="input" type="number" min={0} max={100} value={disc.discountPercent}
                  onChange={(e) => setDisc({ ...disc, discountPercent: Number(e.target.value) })} /></div>
                <div className="field" style={{ gridColumn: "span 2" }}><label>Discount reason {needsApproval && "*"}</label><input className="input" value={disc.discountReason}
                  onChange={(e) => setDisc({ ...disc, discountReason: e.target.value })} /></div>
              </div>
              <p className="small muted">GST is applied from the service master. Discounts don't apply to package lines.</p>
            </div>
          ) : (
            <DataTable rows={inv.items} cols={[
              { key: "description", head: "Description", render: (i: any) => <>{i.description}{i.isPackage && <span className="muted small"> · package</span>}</> },
              { key: "qty", head: "Qty", align: "right", render: (i: any) => Number(i.qty) }, { key: "rate", head: "Rate", align: "right", render: (i: any) => money(i.rate) },
              { key: "discountAmount", head: "Discount", align: "right", render: (i: any) => Number(i.discountAmount) ? `− ${money(i.discountAmount)}` : "—" },
              { key: "gst", head: "GST", align: "right", render: (i: any) => Number(i.gstRate) ? `${Number(i.gstRate)}% · ${money(i.gstAmount)}` : "—" },
              { key: "netAmount", head: "Net", align: "right", render: (i: any) => money(i.netAmount) },
            ]} />
          )}
        </Panel>
        <div className="grid-2">
          <Panel title="Payments" pad={false}>
            <DataTable rows={inv.payments} empty="No payments recorded." cols={[
              { key: "code", head: "Receipt" }, { key: "createdAt", head: "When", render: (p: any) => dt(p.createdAt) }, { key: "mode", head: "Mode", render: (p: any) => label(p.mode) },
              { key: "referenceNo", head: "Ref", render: (p: any) => p.referenceNo ?? "—" }, { key: "amount", head: "Amount", align: "right", render: (p: any) => money(p.amount) },
              { key: "status", head: "", render: (p: any) => p.status === "posted" && can("payment.cancel") ? <button className="btn btn-ghost small" type="button"
                onClick={() => window.confirm(`Cancel receipt ${p.code}?`) && run("pc", () => api.post(`/api/payments/${p.id}/cancel`), "Payment cancelled").then(() => reload())}>Cancel</button>
                : <Tag s={p.status} /> },
            ]} />
          </Panel>
          <Panel title="Summary">
            <div className="totals">
              <div><span>Gross</span><span>{money(inv.grossAmount)}</span></div>
              <div><span>Discount ({Number(inv.discountPercent)}%)</span><span>− {money(inv.discountAmount)}</span></div>
              <div><span>Taxable</span><span>{money(inv.taxableAmount)}</span></div>
              <div><span>CGST</span><span>{money(inv.cgstAmount)}</span></div>
              <div><span>SGST</span><span>{money(inv.sgstAmount)}</span></div>
              <div className="grand"><span>Total</span><span>{money(inv.grandTotal)}</span></div>
              <div><span>Paid</span><span>{money(inv.paidAmount)}</span></div>
              <div className="strong"><span>Outstanding</span><span className={Number(inv.outstandingAmount) > 0 ? "crit" : ""}>{money(inv.outstandingAmount)}</span></div>
            </div>
          </Panel>
        </div>
      </div>
      {paying && <FormDialog title={`Collect payment · due ${money(inv.outstandingAmount)}`} submitLabel="Record payment" onClose={() => setPaying(false)}
        initial={{ amount: Number(inv.outstandingAmount), mode: "cash" }} fields={[
          { name: "amount", label: "Amount (₹)", type: "number", required: true },
          { name: "mode", label: "Mode", type: "select", required: true, options: PAYMENT_MODES.map((m) => ({ value: m, label: label(m) })) },
          { name: "referenceNo", label: "Reference no.", hint: `Required for ${REF_REQUIRED_MODES.join(", ")}` },
        ]} submit={async (v) => { const r = await api.post("/api/payments", { ...v, invoiceId: id }); toast(`Receipt ${r.code} recorded`); setPaying(false); void reload(); }} />}
    </>
  );
}
