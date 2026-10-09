"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientPicker, type PatientLite } from "@/components/domain";
import { Dialog, ErrorBox, PageHead, Panel, Tag } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { mins, time } from "@/lib/format";
import { useData, useEvents } from "@/lib/hooks";
import { useSession } from "@/lib/session";

import { IconOpd, IconPlus } from "@/components/icons";

const BAR: Record<string, string> = { urgent: "var(--st-crit-solid)", senior: "var(--st-warn)", normal: "var(--line)" };

function Queue() {
  const { lookups, can, me } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [doctorId, setDoctorId] = useState("");
  const [walkin, setWalkin] = useState<string | null>(params.get("walkin"));
  useEffect(() => { if (me?.doctorId && !doctorId) setDoctorId(me.doctorId); }, [me, doctorId]);
  const { data, reload } = useData<any[]>(`/api/opd/queue${qs({ doctorId })}`);
  useEvents(["opd"], () => void reload());
  const lanes = [
    { id: "wait", title: "Waiting / Vitals", rows: data?.filter((v) => ["waiting", "vitals"].includes(v.status)) },
    { id: "room", title: "In Consultation", rows: data?.filter((v) => v.status === "in_consultation") },
    { id: "done", title: "Completed", rows: data?.filter((v) => ["completed", "cancelled"].includes(v.status)) },
  ];
  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconOpd size={14} /> Live Consultation Board
          </span>
        }
        title="OPD Queue"
        actions={<>
          <select className="input" style={{ minWidth: 240 }} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">All doctors</option>{lookups?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          {can("opd.write") && (
            <button className="btn btn-primary" onClick={() => setWalkin("")} type="button">
              <IconPlus size={16} />
              <span>Walk-in</span>
            </button>
          )}
        </>}
      />
      <div className="page">
        <div className="lanes">
          {lanes.map((l) => (
            <Panel key={l.id} title={`${l.title} (${l.rows?.length ?? 0})`} pad={false}>
              {!l.rows?.length && <p className="muted" style={{ padding: 16, margin: 0 }}>Empty</p>}
              {l.rows?.map((v) => (
                <div key={v.id} className="lane-card" onClick={() => router.push(`/opd/${v.id}`)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/opd/${v.id}`)}>
                  <div className="lane-bar" style={{ ["--bar" as any]: BAR[v.priority] }} />
                  <div className="minw0">
                    <div className="row gap-2"><span className="token">{v.token}</span>{v.priority !== "normal" && <Tag s={v.priority} />}</div>
                    <div className="ellipsis">{v.patientName} <span className="muted small">{v.ageSex}</span></div>
                    <div className="small muted ellipsis">{v.doctorName}</div>
                  </div>
                  <div className="right small">
                    <Tag s={v.status} />
                    <div className="muted" style={{ marginTop: 4 }}>{l.id === "done" ? time(v.arrivedAt) : `${mins(v.status === "in_consultation" ? v.consultationStartedAt : v.arrivedAt)} min`}</div>
                  </div>
                </div>
              ))}
            </Panel>
          ))}
        </div>
      </div>
      {walkin !== null && <WalkIn presetId={walkin} onClose={() => setWalkin(null)} onDone={() => { setWalkin(null); void reload(); }} />}
    </>
  );
}

function WalkIn({ presetId, onClose, onDone }: { presetId: string; onClose: () => void; onDone: () => void }) {
  const { lookups, toast } = useSession();
  const [p, setP] = useState<PatientLite | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (presetId) api.get(`/api/patients/${presetId}`).then(setP).catch(() => undefined); }, [presetId]);
  const save = async () => {
    setErr(null);
    try {
      if (!p) throw new Error("Select a patient");
      const v = await api.post("/api/opd", { patientId: p.id, doctorId, priority });
      toast(`Token ${v.token} issued`); onDone();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Dialog title="Walk-in: issue token" onClose={onClose}
      actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button><button className="btn btn-primary" onClick={save} type="button">Issue token</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="field"><label>Patient</label><PatientPicker value={p} onChange={setP} autoFocus /></div>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="field" style={{ gridColumn: "span 2" }}><label>Doctor *</label><select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">—</option>{lookups?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div className="field"><label>Triage</label><select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="normal">Normal</option><option value="senior">Senior citizen</option><option value="urgent">Urgent</option></select></div>
      </div>
    </Dialog>
  );
}
export default function Page() { return <Suspense><Queue /></Suspense>; }
