export const ROLES = [
  "admin", // HIMS Administrator
  "superintendent", // Medical Superintendent
  "doctor",
  "nurse",
  "front_office",
  "billing",
  "pharmacist",
  "store_manager",
  "vendor_admin",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "HIMS Administrator",
  superintendent: "Medical Superintendent",
  doctor: "Doctor",
  nurse: "Nurse",
  front_office: "Front Office",
  billing: "Billing Executive",
  pharmacist: "Pharmacist",
  store_manager: "Store Manager",
  vendor_admin: "Vendor Admin",
};

const CLINICAL: Role[] = ["admin", "superintendent", "doctor", "nurse", "front_office"];

/** Permission -> roles allowed. Checked server-side on every route; the web uses it only to hide UI. */
export const PERMISSIONS = {
  "masters.read": ["admin", "superintendent", "doctor", "nurse", "front_office", "billing", "pharmacist", "store_manager"],
  "masters.write": ["admin"],
  "users.manage": ["admin"],
  "settings.write": ["admin"],
  "audit.read": ["admin"],

  "patient.read": [...CLINICAL, "billing", "pharmacist"],
  "patient.write": CLINICAL,
  "appointment.read": CLINICAL,
  "appointment.write": ["admin", "doctor", "front_office"],
  "opd.read": [...CLINICAL, "pharmacist", "billing"],
  "opd.write": ["admin", "doctor", "nurse", "front_office"],
  "opd.complete": ["admin", "doctor"],

  "ipd.read": [...CLINICAL, "billing"],
  "ipd.write": ["admin", "superintendent", "doctor", "nurse", "front_office"],
  "bed.write": ["admin", "nurse"],

  "invoice.read": ["admin", "superintendent", "billing", "front_office", "doctor"],
  "invoice.write": ["admin", "billing", "front_office", "superintendent"],
  "invoice.finalize": ["admin", "billing", "superintendent"],
  "invoice.cancel": ["admin", "billing"],
  "discount.approve": ["superintendent"],
  "payment.collect": ["admin", "billing", "front_office"],
  "payment.cancel": ["admin", "billing"],

  "stock.read": ["admin", "store_manager", "pharmacist", "nurse"],
  "stock.write": ["admin", "store_manager", "pharmacist"],
  "po.approve": ["admin", "store_manager"],
  "pharmacy.sell": ["admin", "pharmacist"],
  "pharmacy.cancel": ["admin", "pharmacist"],

  "vendor.read": ["vendor_admin"],
  "vendor.write": ["vendor_admin"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(roles: readonly string[] | undefined, perm: Permission): boolean {
  if (!roles) return false;
  const allowed = PERMISSIONS[perm] as readonly string[];
  return roles.some((r) => allowed.includes(r));
}
