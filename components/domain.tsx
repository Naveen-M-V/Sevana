"use client";
import { useEffect, useState, type ReactNode } from "react";
import { api, qs } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Dialog, ErrorBox, Fields, opts, type FieldDef } from "./ui";

export interface PatientLite { id: string; mrn: string; fullName: string; age?: string; gender?: string; mobile?: string | null }

/** Type-ahead patient search (name / MRN / mobile / ABHA). */
export function PatientPicker({ value, onChange, autoFocus }: { value: PatientLite | null; onChange: (p: PatientLite | null) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PatientLite[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setRows([]); return; }
    const t = setTimeout(() => api.get<PatientLite[]>(`/api/patients${qs({ q })}`).then(setRows).catch(() => setRows([])), 220);
    return () => clearTimeout(t);
  }, [q]);
  if (value) {
    return (
      <div className="row gap-2 picked">
        <div className="grow"><strong>{value.fullName}</strong> <span className="muted small">{value.mrn}{value.age ? ` · ${value.age}` : ""}</span></div>
        <button className="btn btn-ghost small" onClick={() => onChange(null)} type="button">Change</button>
      </div>
    );
  }
  return (
    <div className="picker">
      <input className="input" placeholder="Search name, MRN, mobile or ABHA" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} />
      {rows.length > 0 && (
        <div className="picker-list">
          {rows.slice(0, 8).map((p) => (
            <button key={p.id} className="picker-row" onClick={() => { onChange(p); setQ(""); }} type="button">
              <strong>{p.fullName}</strong><span className="muted small">{p.mrn} · {p.age} · {p.mobile ?? "no mobile"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PATIENT_FIELDS = (branches: { value: string; label: string }[]): FieldDef[] => [
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name" },
  { name: "gender", label: "Gender", type: "select", required: true, options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }] },
  { name: "dateOfBirth", label: "Date of birth", type: "date" },
  { name: "approxAge", label: "Approx. age (if DOB unknown)", type: "number" },
  { name: "bloodGroup", label: "Blood group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => ({ value: b, label: b })) },
  { name: "mobile", label: "Mobile", placeholder: "98xxxxxxxx" },
  { name: "email", label: "Email", type: "email" },
  { name: "abhaNumber", label: "ABHA number", placeholder: "12-3456-7890-1234" },
  { name: "branchId", label: "Registered at", type: "select", required: true, options: branches },
  { name: "emergencyContactName", label: "Emergency contact" },
  { name: "emergencyContactPhone", label: "Emergency phone" },
  { name: "address", label: "Address", span: 2 },
  { name: "city", label: "City" },
  { name: "payerType", label: "Payer", type: "select", options: [{ value: "self", label: "Self pay" }, { value: "insurance", label: "Insurance" }, { value: "corporate", label: "Corporate" }] },
  { name: "insurer", label: "Insurer / TPA" },
  { name: "policyNumber", label: "Policy number" },
  { name: "chronicConditions", label: "Chronic conditions", type: "textarea", span: 3 },
  { name: "isUnknown", label: "Unidentified patient", type: "checkbox", hint: "Emergency — identity not known" },
];

export function PatientForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: (p: any) => void }) {
  const { lookups, me, toast } = useSession();
  const [v, setV] = useState<Record<string, any>>(initial ?? { gender: "male", payerType: "self", branchId: me?.branchId ?? lookups?.branches[0]?.id, allergies: [] });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allergies: any[] = v.allergies ?? [];
  const setAllergy = (i: number, k: string, val: string) => setV({ ...v, allergies: allergies.map((a, j) => (j === i ? { ...a, [k]: val } : a)) });
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const body = { ...v, allergies: allergies.filter((a) => a.allergen?.trim()) };
      const p = initial?.id ? await api.put(`/api/patients/${initial.id}`, body) : await api.post("/api/patients", body);
      if (p.possibleDuplicate) toast(`Registered. Possible duplicate of ${p.possibleDuplicate}; please verify.`, "crit");
      else toast(initial?.id ? "Patient updated" : `Registered ${p.mrn}`);
      onSaved(p);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Dialog title={initial?.id ? `Edit ${initial.fullName}` : "Register patient"} onClose={onClose} wide actions={<>
      <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
      <button className="btn btn-primary" onClick={save} disabled={busy} type="button">{busy ? "Saving…" : "Save patient"}</button></>}>
      {err && <ErrorBox>{err}</ErrorBox>}
      <Fields fields={PATIENT_FIELDS(opts(lookups?.branches, (b) => b.name))} value={v} onChange={setV} />
      <h5 style={{ margin: "18px 0 8px" }}>Allergies</h5>
      <table className="table lines">
        <thead><tr><th>Allergen</th><th>Reaction</th><th>Severity</th><th /></tr></thead>
        <tbody>
          {allergies.map((a, i) => (
            <tr key={i}>
              <td><input className="input" value={a.allergen ?? ""} onChange={(e) => setAllergy(i, "allergen", e.target.value)} placeholder="e.g. Penicillin" /></td>
              <td><input className="input" value={a.reaction ?? ""} onChange={(e) => setAllergy(i, "reaction", e.target.value)} /></td>
              <td><select className="input" value={a.severity ?? "moderate"} onChange={(e) => setAllergy(i, "severity", e.target.value)}>
                {["mild", "moderate", "severe", "anaphylaxis"].map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
              <td><button className="btn btn-ghost small" onClick={() => setV({ ...v, allergies: allergies.filter((_, j) => j !== i) })} type="button">Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-ghost" onClick={() => setV({ ...v, allergies: [...allergies, { allergen: "", severity: "moderate" }] })} type="button">+ Add allergy</button>
    </Dialog>
  );
}

export function AllergyBanner({ allergies }: { allergies: { allergen: string; severity: string; reaction?: string | null }[] }) {
  if (!allergies?.length) return <span className="st" style={{ background: "var(--st-ok-bg)", color: "var(--st-ok)" }}>No known allergies</span>;
  return <div className="allergy">Allergies: {allergies.map((a) => `${a.allergen} (${a.severity}${a.reaction ? `, ${a.reaction}` : ""})`).join("; ")}</div>;
}

/** Editable rows for invoice/charge style line items. */
export function LineEditor<T extends Record<string, any>>({ rows, setRows, cols, blank }: {
  rows: T[]; setRows: (r: T[]) => void; blank: T;
  cols: { key: keyof T & string; head: string; width?: string; render?: (row: T, set: (patch: Partial<T>) => void) => ReactNode; type?: string }[] }) {
  const update = (i: number, patch: Partial<T>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <>
      <div className="table-wrap">
        <table className="table lines">
          <thead><tr>{cols.map((c) => <th key={c.key} style={{ width: c.width }}>{c.head}</th>)}<th style={{ width: 70 }} /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => <td key={c.key}>{c.render ? c.render(r, (p) => update(i, p)) :
                  <input className="input" type={c.type ?? "text"} step="any" value={r[c.key] ?? ""}
                    onChange={(e) => update(i, { [c.key]: c.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value } as Partial<T>)} />}</td>)}
                <td><button className="btn btn-ghost small" onClick={() => setRows(rows.filter((_, j) => j !== i))} type="button">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost" onClick={() => setRows([...rows, { ...blank }])} type="button">+ Add row</button>
    </>
  );
}
