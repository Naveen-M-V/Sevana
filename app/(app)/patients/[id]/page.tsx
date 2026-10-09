"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCalendarPlus, IconOpd, IconPatients } from "@/components/icons";
import { AllergyBanner, PatientForm } from "@/components/domain";
import { DataTable, PageHead, Panel, Tag } from "@/components/ui";
import { date, dt, money } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";

export default function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can } = useSession();
  const { data: p, error, reload } = useData<any>(`/api/patients/${id}`);
  const [editing, setEditing] = useState(false);
  if (error) return <div className="page"><div className="alert alert-crit">{error}</div></div>;
  if (!p) return <div className="page muted">Loading…</div>;
  return (
    <>
      <PageHead
        kicker={<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconPatients size={14} /> {p.mrn} · {p.age} / {p.gender}{p.bloodGroup ? ` · ${p.bloodGroup}` : ""}</span>}
        title={p.fullName}
        actions={<>
          {can("patient.write") && <button className="btn btn-secondary" onClick={() => setEditing(true)} type="button">Edit Profile</button>}
          {can("appointment.write") && <button className="btn btn-secondary" onClick={() => router.push(`/appointments?patient=${p.id}`)} type="button"><IconCalendarPlus size={14} style={{ marginRight: 6 }} /> Book appointment</button>}
          {can("opd.write") && <button className="btn btn-primary" onClick={() => router.push(`/opd?walkin=${p.id}`)} type="button"><IconOpd size={14} style={{ marginRight: 6 }} /> Send to OPD</button>}
        </>}>
        <div style={{ marginTop: 10 }}><AllergyBanner allergies={p.allergies} /></div>
      </PageHead>
      <div className="page">
        <div className="grid-side">
          <div className="page" style={{ padding: 0 }}>
            <Panel title="OPD visits" pad={false}>
              <DataTable rows={p.visits} empty="No visits yet." onRow={(v: any) => router.push(`/opd/${v.id}`)} cols={[
                { key: "date", head: "Date", render: (v: any) => date(v.date) }, { key: "code", head: "Visit" }, { key: "doctor", head: "Doctor" },
                { key: "chiefComplaint", head: "Complaint", render: (v: any) => v.chiefComplaint ?? "—" }, { key: "status", head: "Status", render: (v: any) => <Tag s={v.status} /> },
              ]} />
            </Panel>
            <Panel title="Admissions" pad={false}>
              <DataTable rows={p.admissions} empty="No admissions." onRow={(a: any) => router.push(`/ipd/${a.id}`)} cols={[
                { key: "code", head: "IP no." }, { key: "admittedAt", head: "Admitted", render: (a: any) => dt(a.admittedAt) },
                { key: "dischargedAt", head: "Discharged", render: (a: any) => dt(a.dischargedAt) }, { key: "reason", head: "Reason" },
                { key: "status", head: "Status", render: (a: any) => <Tag s={a.status} /> },
              ]} />
            </Panel>
            {can("invoice.read") && <Panel title="Invoices" pad={false}>
              <DataTable rows={p.invoices} empty="No invoices." onRow={(i: any) => router.push(`/billing/${i.id}`)} cols={[
                { key: "code", head: "Invoice" }, { key: "date", head: "Date", render: (i: any) => date(i.date) }, { key: "type", head: "Type" },
                { key: "total", head: "Total", align: "right", render: (i: any) => money(i.total) },
                { key: "outstanding", head: "Due", align: "right", render: (i: any) => money(i.outstanding) },
                { key: "status", head: "Status", render: (i: any) => <Tag s={i.status} /> },
              ]} />
            </Panel>}
          </div>
          <Panel title="Details">
            <dl className="kv">
              <dt>Mobile</dt><dd>{p.mobile ?? "—"}</dd>
              <dt>Email</dt><dd>{p.email ?? "—"}</dd>
              <dt>ABHA</dt><dd>{p.abhaNumber ?? "—"}</dd>
              <dt>Date of birth</dt><dd>{p.dateOfBirth ? date(p.dateOfBirth) : `~${p.approxAge} y`}</dd>
              <dt>Emergency</dt><dd>{p.emergencyContactName ?? "—"} {p.emergencyContactPhone ?? ""}</dd>
              <dt>Address</dt><dd>{[p.address, p.city, p.pincode].filter(Boolean).join(", ") || "—"}</dd>
              <dt>Payer</dt><dd>{p.payerType}{p.insurer ? ` · ${p.insurer}` : ""}{p.policyNumber ? ` · ${p.policyNumber}` : ""}</dd>
              <dt>Chronic</dt><dd>{p.chronicConditions ?? "—"}</dd>
            </dl>
          </Panel>
        </div>
      </div>
      {editing && <PatientForm initial={p} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); void reload(); }} />}
    </>
  );
}
