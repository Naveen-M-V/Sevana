export const OPD_STATUSES = ["waiting", "vitals", "in_consultation", "completed", "cancelled"] as const;
export type OpdStatus = (typeof OPD_STATUSES)[number];
export const OPD_TRANSITIONS: Record<string, OpdStatus[]> = {
  waiting: ["vitals", "in_consultation", "cancelled"],
  vitals: ["in_consultation", "waiting", "cancelled"],
  in_consultation: ["waiting"], // completion goes through /complete
};
export const PRIORITIES = ["normal", "senior", "urgent"] as const;
export const PRIORITY_RANK: Record<string, number> = { urgent: 0, senior: 1, normal: 2 };

export const BED_STATUSES = ["available", "occupied", "reserved", "cleaning", "maintenance"] as const;
export const INVOICE_STATUSES = ["draft", "unpaid", "partly_paid", "paid", "cancelled"] as const;
export const PAYMENT_MODES = ["cash", "upi", "card", "bank_transfer", "insurance", "advance"] as const;
export const REF_REQUIRED_MODES = ["upi", "card", "bank_transfer", "insurance"];
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export const DRUG_SCHEDULES = ["", "OTC", "H", "H1", "X"] as const;
export const RESTRICTED_SCHEDULES = ["H1", "X"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const LICENSABLE_MODULES = ["patient_care", "inpatient", "revenue", "pharmacy", "inventory", "laboratory", "insurance", "emergency", "reports", "mobile"] as const;
export const CONTRACT_STATUSES = ["active", "grace", "suspended", "expired", "cancelled"] as const;

export const INDIAN_MOBILE_RE = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function label(s: string) {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
