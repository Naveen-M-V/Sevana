"use client";
import { useState } from "react";
import { IconAudit } from "@/components/icons";
import { DataTable, PageHead, Panel } from "@/components/ui";
import { qs } from "@/lib/api";
import { dt } from "@/lib/format";
import { useData } from "@/lib/hooks";

export default function Audit() {
  const [entity, setEntity] = useState("");
  const { data, loading } = useData<any[]>(`/api/audit-log${qs({ entity })}`);
  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconAudit size={14} /> Administration</span>}
        title="Audit Log"
      />
      <div className="page">
        <Panel pad={false} title={<select className="input" style={{ maxWidth: 260 }} value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="">All entities</option>
          {["patient", "opd_visit", "admission", "invoice", "payment", "pharmacy_sale", "goods_receipt", "stock_movement", "user", "settings", "licence_contract"].map((e) => <option key={e} value={e}>{e}</option>)}
        </select>}>
          <DataTable rows={data} loading={loading} cols={[
            { key: "at", head: "When", render: (r: any) => dt(r.at) }, { key: "action", head: "Action", render: (r: any) => <span className="strong">{r.action}</span> },
            { key: "entity", head: "Entity" }, { key: "entityId", head: "Record", render: (r: any) => <span className="mono small">{r.entityId?.slice(0, 8)}</span> },
            { key: "userId", head: "User", render: (r: any) => r.userEmail ?? "system" }, { key: "ip", head: "IP" },
            { key: "data", head: "Detail", render: (r: any) => <span className="small muted" style={{ display: "block", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.data ? JSON.stringify(r.data) : ""}</span> },
          ]} />
        </Panel>
      </div>
    </>
  );
}
