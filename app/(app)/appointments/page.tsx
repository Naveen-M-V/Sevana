"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientPicker, type PatientLite } from "@/components/domain";
import { DataTable, Dialog, ErrorBox, PageHead, Panel, Tag, useAction } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { todayIso } from "@/lib/format";
import { useData } from "@/lib/hooks";
import { useSession } from "@/lib/session";
import { IconAppointments } from "@/components/icons";

function Appointments() {
  const { lookups, can, toast, me } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [day, setDay] = useState(todayIso());
  const [doctorId, setDoctorId] = useState<string>("");
  const [booking, setBooking] = useState<string | null>(null);
  const { busy, run } = useAction(toast);
  useEffect(() => {
    if (!doctorId && lookups?.doctors.length) setDoctorId(me?.doctorId ?? lookups.doctors[0].id);
  }, [lookups, doctorId, me]);
  const slots = useData<any[]>(doctorId ? `/api/appointments/slots${qs({ doctorId, date: day })}` : null);
  const list = useData<any[]>(`/api/appointments${qs({ date: day, doctorId })}`);
  const reload = () => { void slots.reload(); void list.reload(); };

  const act = async (a: any, action: string) => {
    let body: any = {};
    if (action === "cancel") {
      const reason = window.prompt("Reason for cancellation?");
      if (!reason) return;
      body = { reason };
    }
    if (await run(a.id + action, () => api.post(`/api/appointments/${a.id}/${action}`, body), action === "check-in" ? "Checked in; token issued" : "Updated")) reload();
  };

  return (
    <>
      <PageHead
        kicker={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconAppointments size={14} /> Schedule & Booking
          </span>
        }
        title="Appointments"
      />
      <div className="page">
        <div className="toolbar">
          <div className="field"><label>Date</label><input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} /></div>
          <div className="field" style={{ minWidth: 260 }}><label>Doctor</label>
            <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {lookups?.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        </div>
        <div className="grid-side">
          <Panel title={`Booked (${list.data?.length ?? 0})`} pad={false}>
            <DataTable rows={list.data} loading={list.loading} empty="No appointments for this day." cols={[
              { key: "time", head: "Time", render: (a: any) => <span className="mono strong">{a.time.slice(0, 5)}</span> },
              { key: "patientName", head: "Patient", render: (a: any) => <a onClick={() => router.push(`/patients/${a.patientId}`)} style={{ cursor: "pointer" }}>{a.patientName} <span className="muted small">{a.mrn}</span></a> },
              { key: "type", head: "Type" },
              { key: "status", head: "Status", render: (a: any) => <Tag s={a.status} /> },
              { key: "x", head: "", render: (a: any) => a.status === "scheduled" ? (
                <div className="row gap-2">
                  {can("opd.write") && a.date === todayIso() && <button className="btn btn-secondary small" disabled={!!busy} onClick={() => act(a, "check-in")} type="button">Check in</button>}
                  {can("appointment.write") && <button className="btn btn-ghost small" disabled={!!busy} onClick={() => act(a, "no-show")} type="button">No-show</button>}
                  {can("appointment.write") && <button className="btn btn-ghost small" disabled={!!busy} onClick={() => act(a, "cancel")} type="button">Cancel</button>}
                </div>) : a.opdVisitId ? <button className="btn btn-ghost small" onClick={() => router.push(`/opd/${a.opdVisitId}`)} type="button">Open visit</button> : null },
            ]} />
          </Panel>
          <Panel title="Slots">
            {!slots.data?.length && <p className="muted">{slots.loading ? "Loading…" : "Doctor has no session on this day."}</p>}
            <div className="slots">
              {slots.data?.map((s) => (
                <button key={s.time} className={`slot ${s.available ? "" : "taken"}`} disabled={!s.available || !can("appointment.write")}
                  onClick={() => setBooking(s.time)} type="button">{s.time}</button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      {booking && <BookDialog doctorId={doctorId} date={day} time={booking} preset={params.get("patient")}
        onClose={() => setBooking(null)} onDone={() => { setBooking(null); reload(); }} />}
    </>
  );
}

function BookDialog({ doctorId, date, time, preset, onClose, onDone }: { doctorId: string; date: string; time: string; preset: string | null; onClose: () => void; onDone: () => void }) {
  const { lookups, toast } = useSession();
  const [p, setP] = useState<PatientLite | null>(null);
  const [type, setType] = useState("new");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (preset) api.get(`/api/patients/${preset}`).then(setP).catch(() => undefined); }, [preset]);
  const save = async () => {
    setErr(null);
    try {
      if (!p) throw new Error("Select a patient");
      await api.post("/api/appointments", { patientId: p.id, doctorId, date, time, type, notes });
      toast(`Booked ${time}`); onDone();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <Dialog title={`Book ${time} · ${lookups?.doctors.find((d) => d.id === doctorId)?.name}`} onClose={onClose}
      actions={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button><button className="btn btn-primary" onClick={save} type="button">Book</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="field"><label>Patient</label><PatientPicker value={p} onChange={setP} autoFocus /></div>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="field"><label>Type</label><select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {["new", "followup", "teleconsult", "procedure"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div className="field" style={{ gridColumn: "span 2" }}><label>Notes</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
    </Dialog>
  );
}
export default function Page() { return <Suspense><Appointments /></Suspense>; }
