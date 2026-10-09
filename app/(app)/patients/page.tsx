"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientForm } from "@/components/domain";
import { DataTable, PageHead, Panel, Tag } from "@/components/ui";
import { qs } from "@/lib/api";
import { date } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { IconPatients, IconUserPlus, IconSearch } from "@/components/icons";

function Patients() {
  const router = useRouter();
  const params = useSearchParams();
  const { can } = useSession();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(params.get("new") === "1");
  const { data, loading } = useData<any[]>(`/api/patients${qs({ q: q.trim().length >= 2 ? q : undefined })}`);

  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconPatients size={14} /> Patient Directory
          </span>
        }
        title="Patients"
        actions={
          can("patient.write") && (
            <button className="btn btn-primary" onClick={() => setCreating(true)} type="button">
              <IconUserPlus size={16} />
              <span>Register Patient</span>
            </button>
          )
        }
      />
      <div className="page">
        <Panel
          pad={false}
          title={
            <div style={{ position: "relative", maxWidth: 420, width: "100%" }}>
              <IconSearch size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search name, MRN, mobile or ABHA…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          }
        >
          <DataTable
            rows={data}
            loading={loading}
            onRow={(p) => router.push(`/patients/${p.id}`)}
            cols={[
              { key: "mrn", head: "MRN", render: (p: any) => <span className="mono strong" style={{ color: "var(--color-accent-700)" }}>{p.mrn}</span> },
              { key: "fullName", head: "Name", render: (p: any) => <span style={{ fontWeight: 600 }}>{p.fullName}</span> },
              { key: "age", head: "Age / Sex", render: (p: any) => `${p.age} / ${p.gender[0].toUpperCase()}` },
              { key: "mobile", head: "Mobile", render: (p: any) => p.mobile ?? "—" },
              { key: "abhaNumber", head: "ABHA Number", render: (p: any) => p.abhaNumber ?? "—" },
              { key: "payerType", head: "Payer", render: (p: any) => <Tag s={p.payerType === "self" ? "draft" : "approved"}>{p.payerType}</Tag> },
              { key: "createdAt", head: "Registered", render: (p: any) => date(p.createdAt) },
            ]}
          />
        </Panel>
      </div>
      {creating && <PatientForm onClose={() => setCreating(false)} onSaved={(p) => router.push(`/patients/${p.id}`)} />}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Patients />
    </Suspense>
  );
}
