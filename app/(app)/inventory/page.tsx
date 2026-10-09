"use client";
import { useEffect, useState } from "react";
import { IconArrowLeftRight, IconInventory, IconPackage, IconPlus } from "@/components/icons";
import { LineEditor } from "@/components/domain";
import { DataTable, Dialog, ErrorBox, PageHead, Panel, Tabs, Tag, useAction } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { date, dt, money, qty } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

export default function Inventory() {
  const { lookups, can, toast } = useSession();
  const [tab, setTab] = useState("stock");
  const [storeId, setStoreId] = useState("");
  const [nearOnly, setNearOnly] = useState(false);
  const [dlg, setDlg] = useState<null | { kind: "po" } | { kind: "grn"; po?: any } | { kind: "mv" }>(null);
  const { busy, run } = useAction(toast);
  useEffect(() => { if (!storeId && lookups?.stores[0]) setStoreId(lookups.stores[0].id); }, [lookups, storeId]);

  const stock = useData<any[]>(tab === "stock" ? `/api/stock/status${qs({ storeId, onlyNearExpiry: nearOnly || undefined })}` : null, [tab]);
  const reorder = useData<any[]>(tab === "reorder" && storeId ? `/api/stock/reorder${qs({ storeId })}` : null, [tab]);
  const pos = useData<any[]>(tab === "po" ? "/api/purchase-orders" : null, [tab]);
  const grns = useData<any[]>(tab === "grn" ? "/api/goods-receipts" : null, [tab]);
  const mvs = useData<any[]>(tab === "mv" ? "/api/stock-movements" : null, [tab]);
  const storeName = (id: string) => lookups?.stores.find((s) => s.id === id)?.name ?? "—";
  const act = (key: string, url: string, ok: string, after: () => void) => run(key, () => api.post(url), ok).then((r) => r && after());
  const receive = async (po: any) => setDlg({ kind: "grn", po: await api.get(`/api/purchase-orders/${po.id}`) });

  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconInventory size={14} /> Pharmacy & Stores</span>}
        title="Inventory"
        actions={<>
          {can("stock.write") && <button className="btn btn-secondary" onClick={() => setDlg({ kind: "mv" })} type="button"><IconArrowLeftRight size={14} style={{ marginRight: 6 }} /> Stock movement</button>}
          {can("stock.write") && <button className="btn btn-secondary" onClick={() => setDlg({ kind: "grn" })} type="button"><IconPackage size={14} style={{ marginRight: 6 }} /> Receive goods</button>}
          {can("stock.write") && <button className="btn btn-primary" onClick={() => setDlg({ kind: "po" })} type="button"><IconPlus size={14} style={{ marginRight: 6 }} /> New purchase order</button>}
        </>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "stock", label: "Stock by batch" }, { id: "reorder", label: "Reorder" }, { id: "po", label: "Purchase orders" },
        { id: "grn", label: "Goods receipts" }, { id: "mv", label: "Movements" }]} />
      <div className="page">
        {["stock", "reorder"].includes(tab) && <div className="toolbar">
          <div className="field"><label>Store</label><select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {tab === "stock" && <option value="">All stores</option>}{lookups?.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          {tab === "stock" && <label className="check"><input type="checkbox" checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)} /> Expiring within 90 days</label>}
        </div>}
        {tab === "stock" && <Panel pad={false}>
          <DataTable rows={stock.data} loading={stock.loading} empty="No stock." cols={[
            { key: "name", head: "Item", render: (r: any) => <>{r.name} <span className="muted small">{r.code}</span></> }, { key: "store", head: "Store" },
            { key: "batchNo", head: "Batch" }, { key: "expiryDate", head: "Expiry", render: (r: any) => <>{date(r.expiryDate)} {r.flag && <Tag s={r.flag} />}</> },
            { key: "qty", head: "Qty", align: "right", render: (r: any) => qty(r.qty) }, { key: "mrp", head: "MRP", align: "right", render: (r: any) => money(r.mrp) },
            { key: "value", head: "Value (cost)", align: "right", render: (r: any) => money(r.value) },
          ]} />
        </Panel>}
        {tab === "reorder" && <Panel pad={false}>
          <DataTable rows={reorder.data} loading={reorder.loading} empty="Nothing at or below reorder level." cols={[
            { key: "name", head: "Item" }, { key: "onHand", head: "On hand", align: "right", render: (r: any) => <span className="crit strong">{qty(r.onHand)}</span> },
            { key: "reorderLevel", head: "Reorder level", align: "right", render: (r: any) => qty(r.reorderLevel) },
            { key: "reorderQty", head: "Suggested order", align: "right", render: (r: any) => qty(r.reorderQty) },
          ]} />
        </Panel>}
        {tab === "po" && <Panel pad={false}>
          <DataTable rows={pos.data} loading={pos.loading} cols={[
            { key: "code", head: "PO", render: (r: any) => <span className="mono strong">{r.code}</span> }, { key: "orderDate", head: "Date", render: (r: any) => date(r.orderDate) },
            { key: "supplier", head: "Supplier" }, { key: "store", head: "Deliver to" }, { key: "grandTotal", head: "Total", align: "right", render: (r: any) => money(r.grandTotal) },
            { key: "status", head: "Status", render: (r: any) => <Tag s={r.status} /> },
            { key: "x", head: "", render: (r: any) => <div className="row gap-2">
              {r.status === "draft" && can("po.approve") && <button className="btn btn-secondary small" disabled={!!busy} type="button"
                onClick={() => act(r.id, `/api/purchase-orders/${r.id}/approve`, "PO approved", pos.reload)}>Approve</button>}
              {["approved", "partly_received"].includes(r.status) && can("stock.write") && <button className="btn btn-secondary small" onClick={() => receive(r)} type="button">Receive</button>}
              {["draft", "approved"].includes(r.status) && can("po.approve") && <button className="btn btn-ghost small" type="button"
                onClick={() => window.confirm(`Cancel ${r.code}?`) && act(r.id + "c", `/api/purchase-orders/${r.id}/cancel`, "Cancelled", pos.reload)}>Cancel</button>}
            </div> },
          ]} />
        </Panel>}
        {tab === "grn" && <Panel pad={false}>
          <DataTable rows={grns.data} loading={grns.loading} cols={[
            { key: "code", head: "GRN", render: (r: any) => <span className="mono strong">{r.code}</span> }, { key: "receiptDate", head: "Date", render: (r: any) => date(r.receiptDate) },
            { key: "supplier", head: "Supplier" }, { key: "store", head: "Store" }, { key: "poCode", head: "PO", render: (r: any) => r.poCode ?? "—" },
            { key: "supplierInvoiceNo", head: "Supplier inv.", render: (r: any) => r.supplierInvoiceNo ?? "—" },
            { key: "totalValue", head: "Value", align: "right", render: (r: any) => money(r.totalValue) }, { key: "status", head: "Status", render: (r: any) => <Tag s={r.status} /> },
            { key: "x", head: "", render: (r: any) => r.status === "posted" && can("stock.write") ? <button className="btn btn-ghost small" type="button"
              onClick={() => window.confirm(`Cancel ${r.code}? This reverses the stock.`) && act(r.id, `/api/goods-receipts/${r.id}/cancel`, "GRN cancelled", grns.reload)}>Cancel</button> : null },
          ]} />
        </Panel>}
        {tab === "mv" && <Panel pad={false}>
          <DataTable rows={mvs.data} loading={mvs.loading} cols={[
            { key: "code", head: "No.", render: (r: any) => <span className="mono strong">{r.code}</span> }, { key: "createdAt", head: "When", render: (r: any) => dt(r.createdAt) },
            { key: "type", head: "Type" }, { key: "from", head: "From", render: (r: any) => storeName(r.fromStoreId) },
            { key: "to", head: "To", render: (r: any) => r.toStoreId ? storeName(r.toStoreId) : "—" }, { key: "reason", head: "Reason" },
            { key: "status", head: "Status", render: (r: any) => <Tag s={r.status} /> },
            { key: "x", head: "", render: (r: any) => r.status === "posted" && can("stock.write") ? <button className="btn btn-ghost small" type="button"
              onClick={() => window.confirm(`Cancel ${r.code}?`) && act(r.id, `/api/stock-movements/${r.id}/cancel`, "Movement reversed", mvs.reload)}>Cancel</button> : null },
          ]} />
        </Panel>}
      </div>
      {dlg?.kind === "po" && <PoDialog onClose={() => setDlg(null)} onDone={() => { setDlg(null); setTab("po"); void pos.reload(); }} />}
      {dlg?.kind === "grn" && <GrnDialog po={dlg.po} onClose={() => setDlg(null)} onDone={() => { setDlg(null); setTab("grn"); void grns.reload(); }} />}
      {dlg?.kind === "mv" && <MovementDialog onClose={() => setDlg(null)} onDone={() => { setDlg(null); setTab("mv"); void mvs.reload(); }} />}
    </>
  );
}

function ItemSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lookups } = useSession();
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">—</option>{lookups?.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>;
}

function Shell({ title, onClose, onSave, err, children }: { title: string; onClose: () => void; onSave: () => void; err: string | null; children: React.ReactNode }) {
  return <Dialog title={title} wide onClose={onClose} actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
    <button className="btn btn-primary" onClick={onSave} type="button">Save</button></>}>{err && <ErrorBox>{err}</ErrorBox>}{children}</Dialog>;
}

function PoDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { lookups, toast } = useSession();
  const [h, setH] = useState({ supplierId: "", storeId: "", expectedDate: "" });
  const [lines, setLines] = useState([{ itemId: "", qty: 1, rate: 0 }]);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    try { const po = await api.post("/api/purchase-orders", { ...h, expectedDate: h.expectedDate || null, lines: lines.filter((l) => l.itemId) }); toast(`${po.code} created (draft)`); onDone(); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <Shell title="New purchase order" onClose={onClose} onSave={save} err={err}>
      <div className="form-grid">
        <div className="field"><label>Supplier *</label><select className="input" value={h.supplierId} onChange={(e) => setH({ ...h, supplierId: e.target.value })}>
          <option value="">—</option>{lookups?.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Deliver to *</label><select className="input" value={h.storeId} onChange={(e) => setH({ ...h, storeId: e.target.value })}>
          <option value="">—</option>{lookups?.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Expected</label><input className="input" type="date" value={h.expectedDate} onChange={(e) => setH({ ...h, expectedDate: e.target.value })} /></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <LineEditor rows={lines} setRows={setLines} blank={{ itemId: "", qty: 1, rate: 0 }} cols={[
          { key: "itemId", head: "Item", render: (r, s) => <ItemSelect value={r.itemId} onChange={(v) => s({ itemId: v })} /> },
          { key: "qty", head: "Qty", width: "110px", type: "number" }, { key: "rate", head: "Rate (ex-GST)", width: "140px", type: "number" },
        ]} />
      </div>
    </Shell>
  );
}

function GrnDialog({ po, onClose, onDone }: { po?: any; onClose: () => void; onDone: () => void }) {
  const { lookups, toast } = useSession();
  const [h, setH] = useState({ supplierId: po?.supplierId ?? "", storeId: po?.storeId ?? "", supplierInvoiceNo: "" });
  const [lines, setLines] = useState<any[]>(po ? po.lines.filter((l: any) => Number(l.qty) > Number(l.receivedQty)).map((l: any) => ({
    itemId: l.itemId, batchNo: "", expiryDate: "", qty: Number(l.qty) - Number(l.receivedQty), rate: Number(l.rate), mrp: null })) : [{ itemId: "", batchNo: "", expiryDate: "", qty: 1, rate: 0, mrp: null }]);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    try {
      const g = await api.post("/api/goods-receipts", { ...h, purchaseOrderId: po?.id ?? null, lines: lines.filter((l) => l.itemId).map((l) => ({ ...l, mrp: l.mrp ?? undefined })) });
      toast(`${g.code} posted`); g.warnings?.forEach((w: string) => toast(w, "crit")); onDone();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Shell title={po ? `Receive against ${po.code}` : "Receive goods"} onClose={onClose} onSave={save} err={err}>
      <div className="form-grid">
        <div className="field"><label>Supplier *</label><select className="input" disabled={!!po} value={h.supplierId} onChange={(e) => setH({ ...h, supplierId: e.target.value })}>
          <option value="">—</option>{lookups?.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Store *</label><select className="input" value={h.storeId} onChange={(e) => setH({ ...h, storeId: e.target.value })}>
          <option value="">—</option>{lookups?.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Supplier invoice no.</label><input className="input" value={h.supplierInvoiceNo} onChange={(e) => setH({ ...h, supplierInvoiceNo: e.target.value })} /></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <LineEditor rows={lines} setRows={setLines} blank={{ itemId: "", batchNo: "", expiryDate: "", qty: 1, rate: 0, mrp: null }} cols={[
          { key: "itemId", head: "Item", render: (r, s) => <ItemSelect value={r.itemId} onChange={(v) => s({ itemId: v })} /> },
          { key: "batchNo", head: "Batch *", width: "120px" }, { key: "expiryDate", head: "Expiry *", width: "150px", type: "date" },
          { key: "qty", head: "Qty", width: "90px", type: "number" }, { key: "rate", head: "Rate", width: "100px", type: "number" }, { key: "mrp", head: "MRP", width: "100px", type: "number" },
        ]} />
      </div>
    </Shell>
  );
}

function MovementDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { lookups, toast } = useSession();
  const [h, setH] = useState({ type: "transfer", fromStoreId: "", toStoreId: "", departmentId: "", reason: "" });
  const [lines, setLines] = useState([{ itemId: "", batchId: "", qty: 1 }]);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    try {
      const m = await api.post("/api/stock-movements", { ...h, toStoreId: h.toStoreId || null, departmentId: h.departmentId || null, lines: lines.filter((l) => l.itemId) });
      toast(`${m.code} posted`); onDone();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Shell title="Stock movement" onClose={onClose} onSave={save} err={err}>
      <div className="form-grid">
        <div className="field"><label>Type</label><select className="input" value={h.type} onChange={(e) => setH({ ...h, type: e.target.value })}>
          <option value="transfer">Transfer between stores</option><option value="issue">Issue to department</option>
          <option value="adjustment">Adjustment (+/−)</option><option value="expiry_writeoff">Expiry write-off</option></select></div>
        <div className="field"><label>{h.type === "adjustment" ? "Store" : "From store"} *</label><select className="input" value={h.fromStoreId} onChange={(e) => setH({ ...h, fromStoreId: e.target.value })}>
          <option value="">—</option>{lookups?.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        {h.type === "transfer" && <div className="field"><label>To store *</label><select className="input" value={h.toStoreId} onChange={(e) => setH({ ...h, toStoreId: e.target.value })}>
          <option value="">—</option>{lookups?.stores.filter((s) => s.id !== h.fromStoreId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
        {h.type === "issue" && <div className="field"><label>Department *</label><select className="input" value={h.departmentId} onChange={(e) => setH({ ...h, departmentId: e.target.value })}>
          <option value="">—</option>{lookups?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>}
        <div className="field" style={{ gridColumn: "span 3" }}><label>Reason *</label><input className="input" value={h.reason} onChange={(e) => setH({ ...h, reason: e.target.value })} /></div>
      </div>
      {h.type === "adjustment" && <p className="small muted">Use a negative quantity to reduce stock (breakage, count variance).</p>}
      <div style={{ marginTop: 14 }}>
        <LineEditor rows={lines} setRows={setLines} blank={{ itemId: "", batchId: "", qty: 1 }} cols={[
          { key: "itemId", head: "Item", render: (r, s) => <ItemSelect value={r.itemId} onChange={(v) => s({ itemId: v, batchId: "" })} /> },
          { key: "batchId", head: "Batch", width: "260px", render: (r, s) => <Batches itemId={r.itemId} storeId={h.fromStoreId} value={r.batchId} onChange={(v) => s({ batchId: v })} /> },
          { key: "qty", head: "Qty", width: "100px", type: "number" },
        ]} />
      </div>
    </Shell>
  );
}

function Batches({ itemId, storeId, value, onChange }: { itemId: string; storeId: string; value: string; onChange: (v: string) => void }) {
  const { data } = useData<any[]>(itemId ? `/api/stock/items/${itemId}/batches${qs({ storeId })}` : null);
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={!itemId}>
    <option value="">—</option>{data?.map((b) => <option key={b.batchId} value={b.batchId}>{b.batchNo} · exp {date(b.expiryDate)} · {Number(b.qty)}</option>)}</select>;
}
