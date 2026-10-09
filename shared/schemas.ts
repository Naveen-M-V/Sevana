import { z } from "zod";
import { BED_STATUSES, DRUG_SCHEDULES, GST_RATES, INDIAN_MOBILE_RE, LICENSABLE_MODULES, PAYMENT_MODES, PRIORITIES } from "./constants";
import { ROLES } from "./rbac";

const id = z.string().uuid();
const optId = id.optional().nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM");
const money = z.coerce.number().nonnegative();
const qty = z.coerce.number().positive();
const optStr = z.string().trim().optional().nullable();
const mobile = z.string().trim().regex(INDIAN_MOBILE_RE, "Enter a valid 10-digit Indian mobile");

// ------------------------------------------------------------ auth / users
export const loginInput = z.object({ email: z.string().email(), password: z.string().min(1) });
export const userInput = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  roles: z.array(z.enum(ROLES)).min(1),
  branchId: optId,
  isActive: z.boolean().default(true),
  password: z.string().min(10, "At least 10 characters").optional(),
});

// ------------------------------------------------------------ masters
export const branchInput = z.object({
  name: z.string().min(1), code: z.string().min(2).max(6), city: optStr, gstin: optStr, phone: optStr,
  address: optStr, isActive: z.boolean().default(true),
});
export const departmentInput = z.object({ name: z.string().min(1), code: z.string().min(1).max(3), isActive: z.boolean().default(true) });
export const scheduleSlot = z.object({
  weekday: z.coerce.number().int().min(0).max(6), fromTime: time, toTime: time,
  slotMinutes: z.coerce.number().int().min(5), room: optStr,
});
export const doctorInput = z.object({
  fullName: z.string().min(1), registrationNo: optStr, departmentId: id, branchId: id, userId: optId,
  consultationServiceId: optId, consultationFee: money.default(0), followupFee: money.default(0),
  isActive: z.boolean().default(true), schedule: z.array(scheduleSlot).default([]),
});
export const serviceInput = z.object({
  code: z.string().min(1), name: z.string().min(1),
  category: z.enum(["consultation", "bed", "procedure", "nursing", "investigation", "consumable", "package", "other"]),
  rate: money, gstRate: z.coerce.number().refine((v) => (GST_RATES as readonly number[]).includes(v), "Invalid GST rate").default(0),
  departmentId: optId, isActive: z.boolean().default(true),
});
export const wardInput = z.object({
  name: z.string().min(1), branchId: id,
  wardType: z.enum(["general", "semi_private", "private", "icu", "hdu", "nicu", "maternity"]),
  floor: optStr, dailyTariff: money, bedChargeServiceId: optId, isActive: z.boolean().default(true),
});
export const bedInput = z.object({ wardId: id, bedNo: z.string().min(1), status: z.enum(BED_STATUSES).default("available") });
export const storeInput = z.object({
  name: z.string().min(1), branchId: id, storeType: z.enum(["central", "substore", "pharmacy", "ot", "ward"]),
  isActive: z.boolean().default(true),
});
export const stockItemInput = z.object({
  code: z.string().min(1), name: z.string().min(1), genericName: optStr, drugClass: optStr,
  category: z.enum(["drug", "consumable", "surgical", "reagent", "implant", "other"]),
  schedule: z.enum(DRUG_SCHEDULES).default(""), uom: z.string().default("Nos"), hsn: optStr,
  gstRate: z.coerce.number().refine((v) => (GST_RATES as readonly number[]).includes(v), "Invalid GST rate").default(12),
  defaultMrp: money.default(0), reorderLevel: z.coerce.number().nonnegative().default(0),
  reorderQty: z.coerce.number().nonnegative().default(0), isActive: z.boolean().default(true),
});
export const supplierInput = z.object({
  name: z.string().min(1), gstin: optStr, drugLicenceNo: optStr, contactPerson: optStr,
  phone: optStr, email: z.string().email().optional().nullable().or(z.literal("")), isActive: z.boolean().default(true),
});
export const settingsInput = z.object({
  hospitalName: z.string().min(1),
  discountApprovalThreshold: z.coerce.number().min(0).max(100),
  pharmacyMaxDiscount: z.coerce.number().min(0).max(100),
  minBedChargeDays: z.coerce.number().int().min(0),
  bedChargeGraceHours: z.coerce.number().min(0).max(23),
  enforceLicence: z.boolean(),
  licenceKey: z.string().optional().nullable(),
});

// ------------------------------------------------------------ patients / OPD
export const allergyInput = z.object({ allergen: z.string().trim().min(1), reaction: optStr, severity: z.enum(["mild", "moderate", "severe", "anaphylaxis"]).default("moderate") });
export const patientInput = z.object({
  firstName: z.string().trim().min(1), lastName: optStr, gender: z.enum(["male", "female", "other"]),
  dateOfBirth: date.optional().nullable(), approxAge: z.coerce.number().int().min(0).max(130).optional().nullable(),
  isUnknown: z.boolean().default(false), bloodGroup: optStr, branchId: id,
  mobile: mobile.optional().nullable().or(z.literal("")), email: z.string().email().optional().nullable().or(z.literal("")),
  abhaNumber: optStr, emergencyContactName: optStr, emergencyContactPhone: mobile.optional().nullable().or(z.literal("")),
  address: optStr, city: optStr, pincode: optStr, chronicConditions: optStr,
  payerType: z.enum(["self", "insurance", "corporate"]).default("self"), insurer: optStr, policyNumber: optStr,
  allergies: z.array(allergyInput).default([]),
}).refine((p) => p.dateOfBirth || p.approxAge != null || p.isUnknown, { message: "Enter date of birth or approximate age", path: ["dateOfBirth"] });

export const appointmentInput = z.object({
  patientId: id, doctorId: id, date, time, type: z.enum(["new", "followup", "teleconsult", "procedure"]).default("new"), notes: optStr,
});
export const opdCreateInput = z.object({ patientId: id, doctorId: id, priority: z.enum(PRIORITIES).default("normal"), appointmentId: optId });
export const rxInput = z.object({
  itemId: id, dosage: optStr, durationDays: z.coerce.number().int().positive().optional().nullable(),
  qty: z.coerce.number().nonnegative().optional().nullable(), instructions: optStr,
});
export const opdUpdateInput = z.object({
  bpSystolic: z.coerce.number().int().optional().nullable(), bpDiastolic: z.coerce.number().int().optional().nullable(),
  pulse: z.coerce.number().int().optional().nullable(), temperature: z.coerce.number().optional().nullable(),
  spo2: z.coerce.number().int().optional().nullable(), respiratoryRate: z.coerce.number().int().optional().nullable(),
  weight: z.coerce.number().optional().nullable(), height: z.coerce.number().optional().nullable(),
  chiefComplaint: optStr, history: optStr, examination: optStr, advice: optStr, followUpDate: date.optional().nullable(),
  diagnoses: z.array(z.object({ icdCode: optStr, description: z.string().min(1), type: z.enum(["provisional", "final"]).default("provisional") })).optional(),
  prescription: z.array(rxInput).optional(),
  allergyOverrideReason: optStr,
});

// ------------------------------------------------------------ IPD
export const admissionInput = z.object({
  patientId: id, doctorId: id, wardId: id, bedId: id,
  admissionType: z.enum(["elective", "emergency", "transfer_in", "daycare"]).default("elective"),
  reason: z.string().trim().min(1), provisionalDiagnosis: optStr, expectedDischarge: date.optional().nullable(),
});
export const chargeInput = z.object({ serviceId: id, qty: qty.default(1), rate: money.optional(), remarks: optStr });
export const dischargeInput = z.object({ type: z.enum(["routine", "lama", "referred", "death"]).default("routine"), summary: optStr });

// ------------------------------------------------------------ billing
export const invoiceItemInput = z.object({ serviceId: optId, description: optStr, qty: qty.default(1), rate: money.optional(), gstRate: z.coerce.number().optional() });
export const invoiceInput = z.object({
  patientId: id, branchId: id, invoiceType: z.enum(["opd", "ipd", "pharmacy", "other"]).default("other"),
  payerType: z.enum(["self", "insurance", "corporate"]).default("self"), insurer: optStr, preAuthNo: optStr,
  discountPercent: z.coerce.number().min(0).max(100).default(0), discountReason: optStr,
  items: z.array(invoiceItemInput).min(1, "Add at least one charge"),
});
export const paymentInput = z.object({ invoiceId: id, amount: z.coerce.number().positive(), mode: z.enum(PAYMENT_MODES), referenceNo: optStr });

// ------------------------------------------------------------ inventory / pharmacy
export const poInput = z.object({
  supplierId: id, storeId: id, expectedDate: date.optional().nullable(),
  lines: z.array(z.object({ itemId: id, qty, rate: money })).min(1),
});
export const grnInput = z.object({
  purchaseOrderId: optId, supplierId: id, storeId: id, supplierInvoiceNo: optStr,
  lines: z.array(z.object({ itemId: id, batchNo: z.string().trim().min(1), expiryDate: date, qty, rate: money, mrp: money.optional() })).min(1),
});
export const movementInput = z.object({
  type: z.enum(["transfer", "adjustment", "issue", "expiry_writeoff"]), fromStoreId: id, toStoreId: optId,
  departmentId: optId, reason: z.string().trim().min(1),
  lines: z.array(z.object({ itemId: id, batchId: id, qty: z.coerce.number().refine((v) => v !== 0, "Qty cannot be 0") })).min(1),
});
export const pharmacySaleInput = z.object({
  patientId: optId, customerName: optStr, opdVisitId: optId, prescribingDoctor: optStr, storeId: id,
  paymentMode: z.enum(["cash", "upi", "card", "ip_account"]).default("cash"), admissionId: optId,
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  items: z.array(z.object({ itemId: id, qty, batchId: optId })).min(1),
});

// ------------------------------------------------------------ vendor licensing
export const planInput = z.object({
  name: z.string().min(1), model: z.enum(["subscription", "perpetual_amc"]), billingCycle: z.enum(["monthly", "quarterly", "annual"]),
  price: money, amcPercent: z.coerce.number().min(0).max(100).default(0),
  maxBranches: z.coerce.number().int().min(1), maxUsers: z.coerce.number().int().min(1),
  modules: z.array(z.enum(LICENSABLE_MODULES)).default([]),
});
export const customerInput = z.object({ name: z.string().min(1), city: optStr, beds: z.coerce.number().int().optional().nullable(), gstin: optStr, contactName: optStr, contactEmail: z.string().email().optional().nullable().or(z.literal("")) });
export const contractInput = z.object({
  customerId: id, planId: id, startDate: date, endDate: date.optional().nullable(), graceDays: z.coerce.number().int().min(0).default(15),
  amount: money.optional(), branches: z.coerce.number().int().min(1).optional(), users: z.coerce.number().int().min(1).optional(),
});

export type PatientInput = z.infer<typeof patientInput>;
