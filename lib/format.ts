const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });
export const money = (n: number | string | null | undefined) => inr.format(Number(n ?? 0));
export const qty = (n: number | string | null | undefined) => num.format(Number(n ?? 0));
export const dt = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(d)) : "—";
export const date = (d: string | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d.slice(0, 10)}T00:00:00Z`)) : "—";
export const time = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(d)) : "—";
export const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
export const mins = (from: string | Date) => Math.max(0, Math.round((Date.now() - new Date(from).getTime()) / 60000));
