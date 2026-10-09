"use client";
import { useEffect, useState, type ReactNode } from "react";
import { label } from "@sevana/shared";
import { IconX } from "@/components/icons";

export function PageHead({ kicker, title, actions, children }: { kicker?: ReactNode; title: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        {kicker && <div className="kicker" suppressHydrationWarning>{kicker}</div>}
        <h1 suppressHydrationWarning>{title}</h1>
        {children}
      </div>
      {actions && <div className="row gap-2 wrap">{actions}</div>}
    </header>
  );
}

export function Kpis({
  items,
}: {
  items: { label: string; value: ReactNode; sub?: ReactNode; tone?: string; icon?: ReactNode; onClick?: () => void }[];
}) {
  return (
    <div className="kpis">
      {items.map((k) => (
        <button key={k.label} className="kpi" onClick={k.onClick} disabled={!k.onClick} type="button">
          <div className="kpi-top">
            <div className="kpi-label">{k.label}</div>
            {k.icon && (
              <div
                className="kpi-icon"
                style={{
                  background: k.tone ? `var(--st-${k.tone}-bg)` : "#f1f5f9",
                  color: k.tone ? `var(--st-${k.tone})` : "#475569",
                }}
              >
                {k.icon}
              </div>
            )}
          </div>
          <div className="kpi-value">{k.value}</div>
          {k.sub && (
            <div className="kpi-sub" style={{ color: `var(--st-${k.tone ?? "inactive"})` }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: `var(--st-${k.tone ?? "inactive"})`,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span>{k.sub}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  pad = true,
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  pad?: boolean;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel-head">
          <h3>{title}</h3>
          {actions}
        </div>
      )}
      <div className={pad ? "panel-body" : ""}>{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  active: "ok",
  available: "ok",
  paid: "ok",
  completed: "done",
  dispensed: "done",
  discharged: "done",
  received: "done",
  posted: "ok",
  valid: "ok",
  waiting: "pend",
  scheduled: "pend",
  vitals: "pend",
  draft: "inactive",
  reserved: "pend",
  approved: "pend",
  checked_in: "pend",
  pending: "warn",
  in_consultation: "warn",
  partly_paid: "warn",
  unpaid: "warn",
  partial: "warn",
  partly_received: "warn",
  grace: "warn",
  cleaning: "warn",
  discharge_initiated: "warn",
  near_expiry: "warn",
  admitted: "pend",
  urgent: "crit",
  senior: "warn",
  normal: "inactive",
  occupied: "crit",
  cancelled: "cancel",
  no_show: "cancel",
  maintenance: "inactive",
  suspended: "crit",
  expired: "crit",
  invalid: "crit",
  unlicensed: "inactive",
  overdue: "crit",
};

export function Tag({ s, children }: { s: string; children?: ReactNode }) {
  const tone = TONES[s] ?? "inactive";
  return (
    <span className="st" style={{ background: `var(--st-${tone}-bg)`, color: `var(--st-${tone})` }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: `var(--st-${tone})`,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span>{children ?? label(s)}</span>
    </span>
  );
}

export interface Col<T> {
  key: string;
  head: ReactNode;
  render?: (r: T) => ReactNode;
  align?: "right";
  width?: string;
}

export function DataTable<T extends { id?: string }>({
  rows,
  cols,
  onRow,
  empty = "Nothing here yet.",
  loading,
}: {
  rows: T[] | null | undefined;
  cols: Col<T>[];
  onRow?: (r: T) => void;
  empty?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={{ textAlign: c.align, width: c.width }}>
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows?.length && (
            <tr>
              <td colSpan={cols.length} className="muted" style={{ textAlign: "center", padding: "32px 16px" }}>
                Loading data…
              </td>
            </tr>
          )}
          {!loading && !rows?.length && (
            <tr>
              <td colSpan={cols.length} className="muted" style={{ textAlign: "center", padding: "32px 16px" }}>
                {empty}
              </td>
            </tr>
          )}
          {rows?.map((r, i) => (
            <tr key={r.id ?? i} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? "clickable" : undefined}>
              {cols.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dialog({
  title,
  onClose,
  children,
  actions,
  wide,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" style={{ width: wide ? "min(980px, 96vw)" : "min(620px, 96vw)" }}>
        <div className="dialog-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>{title}</div>
          <button
            onClick={onClose}
            type="button"
            className="btn btn-ghost small"
            style={{ padding: "4px 8px", color: "#64748b" }}
            aria-label="Close"
          >
            <IconX size={14} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "email" | "password" | "select" | "textarea" | "checkbox" | "multi";
  options?: { value: string; label: string }[];
  required?: boolean;
  span?: 1 | 2 | 3;
  placeholder?: string;
  hint?: string;
  step?: string;
};

export function Fields({
  fields,
  value,
  onChange,
}: {
  fields: FieldDef[];
  value: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="form-grid">
      {fields.map((f) => {
        const v = value[f.name];
        const id = `f-${f.name}`;
        let input: ReactNode;
        if (f.type === "select") {
          input = (
            <select id={id} className="input" value={v ?? ""} required={f.required} onChange={(e) => set(f.name, e.target.value || null)}>
              <option value="">— Select —</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          );
        } else if (f.type === "textarea") {
          input = (
            <textarea
              id={id}
              className="input"
              value={v ?? ""}
              required={f.required}
              placeholder={f.placeholder}
              onChange={(e) => set(f.name, e.target.value)}
            />
          );
        } else if (f.type === "checkbox") {
          input = (
            <label className="check">
              <input id={id} type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} /> {f.hint ?? "Yes"}
            </label>
          );
        } else if (f.type === "multi") {
          const arr: string[] = v ?? [];
          input = (
            <div className="multi">
              {f.options?.map((o) => (
                <label key={o.value} className="check">
                  <input
                    type="checkbox"
                    checked={arr.includes(o.value)}
                    onChange={(e) => set(f.name, e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))}
                  />{" "}
                  {o.label}
                </label>
              ))}
            </div>
          );
        } else {
          input = (
            <input
              id={id}
              className="input"
              type={f.type ?? "text"}
              step={f.step ?? (f.type === "number" ? "any" : undefined)}
              value={v ?? ""}
              required={f.required}
              placeholder={f.placeholder}
              autoComplete={f.type === "password" ? "new-password" : undefined}
              onChange={(e) => set(f.name, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
            />
          );
        }
        return (
          <div key={f.name} className="field" style={{ gridColumn: `span ${f.span ?? 1}` }}>
            <label htmlFor={id}>
              {f.label}
              {f.required && " *"}
            </label>
            {input}
            {f.hint && f.type !== "checkbox" && <div className="hint">{f.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function FormDialog({
  title,
  fields,
  initial,
  submit,
  onClose,
  submitLabel = "Save",
  wide,
  children,
}: {
  title: string;
  fields: FieldDef[];
  initial?: Record<string, any>;
  submit: (v: Record<string, any>) => Promise<void>;
  onClose: () => void;
  submitLabel?: string;
  wide?: boolean;
  children?: (v: Record<string, any>, set: (v: Record<string, any>) => void) => ReactNode;
}) {
  const [v, setV] = useState<Record<string, any>>(initial ?? {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await submit(v);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      title={title}
      onClose={onClose}
      wide={wide}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={go} disabled={busy} type="button">
            {busy ? "Saving…" : submitLabel}
          </button>
        </>
      }
    >
      {err && <ErrorBox>{err}</ErrorBox>}
      <Fields fields={fields} value={v} onChange={setV} />
      {children?.(v, setV)}
    </Dialog>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="alert alert-crit" role="alert">
      {children}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={`tab ${value === t.id ? "on" : ""}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function useAction(toast: (t: string, tone?: "ok" | "crit") => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast(ok);
      return true;
    } catch (e: any) {
      toast(e.message, "crit");
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

export const opts = <T extends { id: string }>(rows: T[] | undefined | null, lab: (r: T) => string) =>
  (rows ?? []).map((r) => ({ value: r.id, label: lab(r) }));
