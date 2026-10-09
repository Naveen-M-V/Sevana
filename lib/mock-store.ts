// In-memory clinical demonstration dataset and operations matching Sevana HIMS seed.ts
import { PERMISSIONS, type Permission, type Role } from "@sevana/shared";

export interface DemoUser {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  branchId: string | null;
  doctorId: string | null;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  "admin@sevana.demo": {
    id: "usr-admin-01",
    email: "admin@sevana.demo",
    fullName: "Hospital Administrator",
    roles: ["admin"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "ms@sevana.demo": {
    id: "usr-ms-01",
    email: "ms@sevana.demo",
    fullName: "Dr. Kavitha Rao (MS)",
    roles: ["superintendent"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "dr.menon@sevana.demo": {
    id: "usr-doc-01",
    email: "dr.menon@sevana.demo",
    fullName: "Dr. Arvind Menon",
    roles: ["doctor"],
    branchId: "br-chn-01",
    doctorId: "doc-menon-01",
  },
  "nurse@sevana.demo": {
    id: "usr-nurse-01",
    email: "nurse@sevana.demo",
    fullName: "Sr. Mary Joseph",
    roles: ["nurse"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "frontdesk@sevana.demo": {
    id: "usr-front-01",
    email: "frontdesk@sevana.demo",
    fullName: "Anitha (Front Desk)",
    roles: ["front_office"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "billing@sevana.demo": {
    id: "usr-bill-01",
    email: "billing@sevana.demo",
    fullName: "Rahul (Billing)",
    roles: ["billing"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "pharmacist@sevana.demo": {
    id: "usr-pharm-01",
    email: "pharmacist@sevana.demo",
    fullName: "Senthil (Pharmacy)",
    roles: ["pharmacist"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "stores@sevana.demo": {
    id: "usr-store-01",
    email: "stores@sevana.demo",
    fullName: "Ganesh (Stores)",
    roles: ["store_manager"],
    branchId: "br-chn-01",
    doctorId: null,
  },
  "vendor@sevana.demo": {
    id: "usr-vendor-01",
    email: "vendor@sevana.demo",
    fullName: "Sevana Vendor Desk",
    roles: ["vendor_admin"],
    branchId: null,
    doctorId: null,
  },
};

export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const perms = new Set<Permission>();
  for (const [perm, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (roles.some((r) => (allowedRoles as readonly string[]).includes(r))) {
      perms.add(perm as Permission);
    }
  }
  return Array.from(perms);
}

// Master tables
export const branches = [
  { id: "br-chn-01", name: "Chennai · Anna Nagar", code: "CHN", city: "Chennai", gstin: "33AAAAA0000A1Z5", phone: "044-26150000", address: "12, 2nd Avenue, Anna Nagar", isActive: true },
  { id: "br-cbe-01", name: "Coimbatore · RS Puram", code: "CBE", city: "Coimbatore", gstin: "33AAAAA0000A2Z4", phone: "0422-2540000", address: "45, DB Road, RS Puram", isActive: true },
  { id: "br-mdu-01", name: "Madurai · KK Nagar", code: "MDU", city: "Madurai", gstin: "33AAAAA0000A3Z3", phone: "0452-2580000", address: "78, 80 Feet Road, KK Nagar", isActive: true },
];

export const departments = [
  { id: "dep-card", name: "Cardiology", code: "C", isActive: true },
  { id: "dep-ortho", name: "Orthopaedics", code: "O", isActive: true },
  { id: "dep-obgyn", name: "Obstetrics & Gynaecology", code: "G", isActive: true },
  { id: "dep-paed", name: "Paediatrics", code: "P", isActive: true },
  { id: "dep-neuro", name: "Neurology", code: "N", isActive: true },
  { id: "dep-genmed", name: "General Medicine", code: "M", isActive: true },
];

export const doctors = [
  { id: "doc-menon-01", code: "DR-0001", name: "Dr. Arvind Menon", fullName: "Dr. Arvind Menon", departmentId: "dep-card", departmentName: "Cardiology", branchId: "br-chn-01", userId: "usr-doc-01", consultationFee: 900, followupFee: 450, registrationNo: "TN-MC-45120", isActive: true },
  { id: "doc-farah-01", code: "DR-0002", name: "Dr. Farah Siddiqui", fullName: "Dr. Farah Siddiqui", departmentId: "dep-obgyn", departmentName: "Obstetrics & Gynaecology", branchId: "br-chn-01", userId: null, consultationFee: 800, followupFee: 400, registrationNo: "TN-MC-52310", isActive: true },
  { id: "doc-nair-01", code: "DR-0003", name: "Dr. Harish Nair", fullName: "Dr. Harish Nair", departmentId: "dep-genmed", departmentName: "General Medicine", branchId: "br-chn-01", userId: null, consultationFee: 600, followupFee: 300, registrationNo: "TN-MC-39820", isActive: true },
  { id: "doc-priya-01", code: "DR-0004", name: "Dr. Priya Raman", fullName: "Dr. Priya Raman", departmentId: "dep-paed", departmentName: "Paediatrics", branchId: "br-chn-01", userId: null, consultationFee: 700, followupFee: 350, registrationNo: "TN-MC-61240", isActive: true },
  { id: "doc-pillai-01", code: "DR-0005", name: "Dr. Suresh Pillai", fullName: "Dr. Suresh Pillai", departmentId: "dep-ortho", departmentName: "Orthopaedics", branchId: "br-chn-01", userId: null, consultationFee: 800, followupFee: 400, registrationNo: "TN-MC-48190", isActive: true },
];

export const services = [
  { id: "svc-01", code: "CONS-GEN", name: "General consultation", category: "consultation", rate: 600, gstRate: 0, departmentId: "dep-genmed", isActive: true },
  { id: "svc-02", code: "BED-GEN", name: "General ward bed-day", category: "bed", rate: 2800, gstRate: 0, departmentId: null, isActive: true },
  { id: "svc-03", code: "BED-PVT", name: "Private room bed-day", category: "bed", rate: 6000, gstRate: 0, departmentId: null, isActive: true },
  { id: "svc-04", code: "BED-ICU", name: "ICU bed-day", category: "bed", rate: 12000, gstRate: 0, departmentId: null, isActive: true },
  { id: "svc-05", code: "NURS-DAY", name: "Nursing care per day", category: "nursing", rate: 800, gstRate: 0, departmentId: null, isActive: true },
  { id: "svc-06", code: "ECG", name: "ECG 12-lead", category: "investigation", rate: 350, gstRate: 0, departmentId: "dep-card", isActive: true },
  { id: "svc-07", code: "DRESS-KIT", name: "Sterile dressing kit", category: "consumable", rate: 450, gstRate: 12, departmentId: null, isActive: true },
  { id: "svc-08", code: "PKG-ANGIO", name: "Coronary angiography package", category: "package", rate: 18000, gstRate: 0, departmentId: "dep-card", isActive: true },
];

export const wards = [
  { id: "w-gen-01", name: "General Ward A", wardType: "general", floor: "2F", dailyTariff: 2800, branchId: "br-chn-01", bedChargeServiceId: "svc-02", isActive: true, occupied: 3, beds: [] as any[] },
  { id: "w-pvt-01", name: "Private 4F", wardType: "private", floor: "4F", dailyTariff: 6000, branchId: "br-chn-01", bedChargeServiceId: "svc-03", isActive: true, occupied: 2, beds: [] as any[] },
  { id: "w-icu-01", name: "ICU", wardType: "icu", floor: "1F", dailyTariff: 12000, branchId: "br-chn-01", bedChargeServiceId: "svc-04", isActive: true, occupied: 2, beds: [] as any[] },
];

export const beds = [
  // General Ward A (G01 to G12)
  { id: "bed-g01", wardId: "w-gen-01", bedNo: "G01", status: "occupied", currentAdmissionId: "adm-01", patientName: "Ramesh Kumar Iyer", admissionCode: "IP-2026-0041" },
  { id: "bed-g02", wardId: "w-gen-01", bedNo: "G02", status: "occupied", currentAdmissionId: "adm-02", patientName: "Vikram Rao", admissionCode: "IP-2026-0044" },
  { id: "bed-g03", wardId: "w-gen-01", bedNo: "G03", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g04", wardId: "w-gen-01", bedNo: "G04", status: "cleaning", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g05", wardId: "w-gen-01", bedNo: "G05", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g06", wardId: "w-gen-01", bedNo: "G06", status: "occupied", currentAdmissionId: null, patientName: "K. Selvam", admissionCode: "IP-2026-0047" },
  { id: "bed-g07", wardId: "w-gen-01", bedNo: "G07", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g08", wardId: "w-gen-01", bedNo: "G08", status: "maintenance", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g09", wardId: "w-gen-01", bedNo: "G09", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g10", wardId: "w-gen-01", bedNo: "G10", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g11", wardId: "w-gen-01", bedNo: "G11", status: "reserved", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-g12", wardId: "w-gen-01", bedNo: "G12", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  // Private 4F (P01 to P06)
  { id: "bed-p01", wardId: "w-pvt-01", bedNo: "P01", status: "occupied", currentAdmissionId: null, patientName: "Ananya Sharma", admissionCode: "IP-2026-0043" },
  { id: "bed-p02", wardId: "w-pvt-01", bedNo: "P02", status: "occupied", currentAdmissionId: null, patientName: "M. Balaji", admissionCode: "IP-2026-0045" },
  { id: "bed-p03", wardId: "w-pvt-01", bedNo: "P03", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-p04", wardId: "w-pvt-01", bedNo: "P04", status: "cleaning", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-p05", wardId: "w-pvt-01", bedNo: "P05", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-p06", wardId: "w-pvt-01", bedNo: "P06", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  // ICU (I01 to I06)
  { id: "bed-i01", wardId: "w-icu-01", bedNo: "I01", status: "occupied", currentAdmissionId: null, patientName: "Deepak Mehta", admissionCode: "IP-2026-0039" },
  { id: "bed-i02", wardId: "w-icu-01", bedNo: "I02", status: "occupied", currentAdmissionId: null, patientName: "R. Sundaram", admissionCode: "IP-2026-0040" },
  { id: "bed-i03", wardId: "w-icu-01", bedNo: "I03", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-i04", wardId: "w-icu-01", bedNo: "I04", status: "cleaning", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-i05", wardId: "w-icu-01", bedNo: "I05", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
  { id: "bed-i06", wardId: "w-icu-01", bedNo: "I06", status: "available", currentAdmissionId: null, patientName: null, admissionCode: null },
];

wards[0].beds = beds.filter((b) => b.wardId === "w-gen-01");
wards[1].beds = beds.filter((b) => b.wardId === "w-pvt-01");
wards[2].beds = beds.filter((b) => b.wardId === "w-icu-01");

export const stores = [
  { id: "str-central-01", name: "Central Store CHN", branchId: "br-chn-01", storeType: "central", isActive: true },
  { id: "str-pharm-01", name: "Main Pharmacy CHN", branchId: "br-chn-01", storeType: "pharmacy", isActive: true },
];

export const suppliers = [
  { id: "sup-01", name: "MedPlus Distributors", gstin: "33AAACM1234D1ZX", drugLicenceNo: "TN-DL-88210", contactPerson: "Karthik", phone: "9840012345", email: "sales@medplus.test", isActive: true },
  { id: "sup-02", name: "Apollo Pharma Supplies", gstin: "33AAACA5678B1ZY", drugLicenceNo: "TN-DL-77340", contactPerson: "Naveen", phone: "9840054321", email: "orders@apollosupply.test", isActive: true },
];

export const items = [
  { id: "it-01", code: "MED-PCM650", name: "Paracetamol 650 mg tab", genericName: "Paracetamol", drugClass: null, category: "drug", schedule: "OTC", uom: "Nos", gstRate: 12, defaultMrp: 3.5, reorderLevel: 100, reorderQty: 500, isActive: true },
  { id: "it-02", code: "MED-AMOX500", name: "Amoxicillin 500 mg cap", genericName: "Amoxicillin", drugClass: "Penicillin", category: "drug", schedule: "H", uom: "Nos", gstRate: 12, defaultMrp: 15.2, reorderLevel: 100, reorderQty: 500, isActive: true },
  { id: "it-03", code: "MED-TELMI40", name: "Telmisartan 40 mg tab", genericName: "Telmisartan", drugClass: "ARB", category: "drug", schedule: "H", uom: "Nos", gstRate: 12, defaultMrp: 11.0, reorderLevel: 80, reorderQty: 400, isActive: true },
  { id: "it-04", code: "MED-MET500", name: "Metformin 500 mg tab", genericName: "Metformin", drugClass: "Biguanide", category: "drug", schedule: "H", uom: "Nos", gstRate: 12, defaultMrp: 4.0, reorderLevel: 150, reorderQty: 600, isActive: true },
  { id: "it-05", code: "MED-ALPRAZ", name: "Alprazolam 0.5 mg tab", genericName: "Alprazolam", drugClass: "Benzodiazepine", category: "drug", schedule: "H1", uom: "Nos", gstRate: 12, defaultMrp: 6.5, reorderLevel: 50, reorderQty: 200, isActive: true },
  { id: "it-06", code: "CON-GLOVE", name: "Surgical gloves (pair)", genericName: null, drugClass: null, category: "consumable", schedule: "", uom: "Pair", gstRate: 12, defaultMrp: 28.0, reorderLevel: 200, reorderQty: 800, isActive: true },
];

// Patients
export const patients: any[] = [
  {
    id: "pat-01",
    mrn: "HSP-00101",
    firstName: "Ramesh Kumar",
    lastName: "Iyer",
    fullName: "Ramesh Kumar Iyer",
    gender: "male",
    dateOfBirth: "1984-03-12",
    age: "42 y",
    approxAge: null,
    bloodGroup: "O+",
    mobile: "9876543210",
    email: "ramesh.iyer@example.com",
    abhaNumber: "14-5542-8901-2345",
    branchId: "br-chn-01",
    payerType: "insurance",
    insurer: "Star Health",
    policyNumber: "SH-DEMO-0042",
    address: "14, Oliver Road, Mylapore",
    city: "Chennai",
    pincode: "600004",
    chronicConditions: "Essential hypertension (2019); Type 2 diabetes (2021)",
    emergencyContactName: "Lalitha Iyer",
    emergencyContactPhone: "9876543211",
    allergies: [{ allergen: "Penicillin", reaction: "Erythematous rash", severity: "moderate" }],
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    visits: [
      { id: "v-01", code: "C-001", date: new Date().toISOString(), doctor: "Dr. Arvind Menon", chiefComplaint: "Chest heaviness and dyspnea on exertion", status: "in_consultation" },
      { id: "v-prev", code: "C-084", date: new Date(Date.now() - 14 * 86400000).toISOString(), doctor: "Dr. Arvind Menon", chiefComplaint: "Routine hypertension review", status: "completed" },
    ],
    admissions: [
      { id: "adm-01", code: "IP-2026-0041", admittedAt: new Date(Date.now() - 2 * 86400000).toISOString(), dischargedAt: null, reason: "Unstable angina observation", status: "admitted" },
    ],
    invoices: [
      { id: "inv-01", code: "INV-2026-0104", date: new Date().toISOString(), type: "opd", total: 950, outstanding: 950, status: "unpaid" },
    ],
  },
  {
    id: "pat-02",
    mrn: "HSP-00102",
    firstName: "Ananya",
    lastName: "Sharma",
    fullName: "Ananya Sharma",
    gender: "female",
    dateOfBirth: "1992-07-25",
    age: "33 y",
    approxAge: null,
    bloodGroup: "B+",
    mobile: "9841234567",
    email: "ananya.sharma@example.com",
    abhaNumber: "91-2345-6789-0123",
    branchId: "br-chn-01",
    payerType: "self",
    insurer: null,
    policyNumber: null,
    address: "88, Greenways Road",
    city: "Chennai",
    pincode: "600028",
    chronicConditions: "None",
    emergencyContactName: "Rohan Sharma",
    emergencyContactPhone: "9841234568",
    allergies: [],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    visits: [
      { id: "v-02", code: "G-002", date: new Date().toISOString(), doctor: "Dr. Farah Siddiqui", chiefComplaint: "Antenatal 2nd trimester checkup", status: "waiting" },
    ],
    admissions: [],
    invoices: [],
  },
  {
    id: "pat-03",
    mrn: "HSP-00103",
    firstName: "Vikram",
    lastName: "Rao",
    fullName: "Vikram Rao",
    gender: "male",
    dateOfBirth: "1958-11-04",
    age: "67 y",
    approxAge: null,
    bloodGroup: "A+",
    mobile: "9884567890",
    email: "vikram.rao@example.com",
    abhaNumber: "45-6789-0123-4567",
    branchId: "br-chn-01",
    payerType: "corporate",
    insurer: "Tata Consultancy Services TPA",
    policyNumber: "TCS-MED-9941",
    address: "21, Karpagam Avenue, RA Puram",
    city: "Chennai",
    pincode: "600028",
    chronicConditions: "Osteoarthritis bilateral knees",
    emergencyContactName: "Sanjay Rao",
    emergencyContactPhone: "9884567891",
    allergies: [{ allergen: "Sulfa drugs", reaction: "Urticaria", severity: "severe" }],
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    visits: [],
    admissions: [
      { id: "adm-02", code: "IP-2026-0044", admittedAt: new Date(Date.now() - 3 * 86400000).toISOString(), dischargedAt: null, reason: "Right knee arthroscopy", status: "admitted" },
    ],
    invoices: [],
  },
];

// Appointments
const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export const appointments: any[] = [
  { id: "apt-01", date: todayIso, time: "09:30:00", doctorId: "doc-menon-01", doctorName: "Dr. Arvind Menon", patientId: "pat-01", patientName: "Ramesh Kumar Iyer", mrn: "HSP-00101", type: "followup", status: "checked_in", opdVisitId: "v-01" },
  { id: "apt-02", date: todayIso, time: "10:00:00", doctorId: "doc-menon-01", doctorName: "Dr. Arvind Menon", patientId: "pat-02", patientName: "Ananya Sharma", mrn: "HSP-00102", type: "new", status: "scheduled", opdVisitId: null },
  { id: "apt-03", date: todayIso, time: "10:15:00", doctorId: "doc-menon-01", doctorName: "Dr. Arvind Menon", patientId: "pat-03", patientName: "Vikram Rao", mrn: "HSP-00103", type: "followup", status: "scheduled", opdVisitId: null },
  { id: "apt-04", date: todayIso, time: "11:00:00", doctorId: "doc-farah-01", doctorName: "Dr. Farah Siddiqui", patientId: "pat-02", patientName: "Ananya Sharma", mrn: "HSP-00102", type: "new", status: "checked_in", opdVisitId: "v-02" },
];

export const opdQueue: any[] = [
  {
    id: "v-01",
    token: "C-001",
    doctorId: "doc-menon-01",
    doctorName: "Dr. Arvind Menon",
    patientId: "pat-01",
    patientName: "Ramesh Kumar Iyer",
    ageSex: "42 y / M",
    priority: "urgent",
    status: "in_consultation",
    arrivedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    consultationStartedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    bpSystolic: 142,
    bpDiastolic: 92,
    pulse: 84,
    temperature: 98.4,
    spo2: 98,
    respiratoryRate: 18,
    weight: 78,
    height: 172,
    chiefComplaint: "Episodes of retrosternal heaviness after fast walking, easing with rest.",
    history: "Hypertensive since 2019 on Telmisartan. Type 2 DM well controlled on Metformin.",
    examination: "S1 S2 normal, no murmurs. Chest clear bilaterally. Trace pedal edema.",
    advice: "Avoid strenuous exertion until TMT/Echo completed. Follow low sodium diet.",
    followUpDate: "2026-10-20",
    diagnoses: [
      { icdCode: "I20.9", description: "Angina pectoris, unspecified", type: "provisional" },
      { icdCode: "I10", description: "Essential (primary) hypertension", type: "final" },
    ],
    prescription: [
      { itemId: "it-03", dosage: "1-0-0", durationDays: 30, qty: 30, instructions: "After breakfast" },
      { itemId: "it-04", dosage: "1-0-1", durationDays: 30, qty: 60, instructions: "With meals" },
    ],
    allergyOverrideReason: null,
  },
  {
    id: "v-02",
    token: "G-002",
    doctorId: "doc-farah-01",
    doctorName: "Dr. Farah Siddiqui",
    patientId: "pat-02",
    patientName: "Ananya Sharma",
    ageSex: "33 y / F",
    priority: "normal",
    status: "waiting",
    arrivedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    consultationStartedAt: null,
    bpSystolic: 110,
    bpDiastolic: 70,
    pulse: 76,
    temperature: 98.6,
    spo2: 99,
    respiratoryRate: 16,
    weight: 62,
    height: 165,
    chiefComplaint: "Routine 22-week anomaly scan review",
    history: null,
    examination: null,
    advice: null,
    followUpDate: null,
    diagnoses: [],
    prescription: [],
    allergyOverrideReason: null,
  },
  {
    id: "v-03",
    token: "C-003",
    doctorId: "doc-menon-01",
    doctorName: "Dr. Arvind Menon",
    patientId: "pat-03",
    patientName: "Vikram Rao",
    ageSex: "67 y / M",
    priority: "senior",
    status: "waiting",
    arrivedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    consultationStartedAt: null,
    bpSystolic: null,
    bpDiastolic: null,
    pulse: null,
    temperature: null,
    spo2: null,
    respiratoryRate: null,
    weight: null,
    height: null,
    chiefComplaint: "Pre-operative cardiac clearance for elective orthopaedic surgery",
    history: null,
    examination: null,
    advice: null,
    followUpDate: null,
    diagnoses: [],
    prescription: [],
    allergyOverrideReason: null,
  },
];

// Admissions
export const admissions: any[] = [
  {
    id: "adm-01",
    code: "IP-2026-0041",
    patientId: "pat-01",
    patient: patients[0],
    doctorId: "doc-menon-01",
    doctorName: "Dr. Arvind Menon",
    admissionType: "emergency",
    reason: "Unstable angina with ischemic ECG changes",
    provisionalDiagnosis: "Acute Coronary Syndrome",
    dischargeSummary: null,
    admittedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    expectedDischarge: "2026-10-09",
    dischargedAt: null,
    status: "admitted",
    invoiceId: "inv-01",
    movements: [
      { wardId: "w-gen-01", wardName: "General Ward A", bedId: "bed-g01", bedNo: "G01", fromAt: new Date(Date.now() - 48 * 3600000).toISOString(), toAt: null, dailyTariff: 2800 },
    ],
    charges: [
      { id: "chg-01", serviceId: "svc-05", serviceName: "Nursing care per day", qty: 2, rate: 800, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), billed: false },
      { id: "chg-02", serviceId: "svc-06", serviceName: "ECG 12-lead", qty: 1, rate: 350, createdAt: new Date(Date.now() - 40 * 3600000).toISOString(), billed: true },
    ],
  },
  {
    id: "adm-02",
    code: "IP-2026-0044",
    patientId: "pat-03",
    patient: patients[2],
    doctorId: "doc-pillai-01",
    doctorName: "Dr. Suresh Pillai",
    admissionType: "elective",
    reason: "Right knee arthroscopy and meniscal debridement",
    provisionalDiagnosis: "Internal derangement of knee",
    dischargeSummary: null,
    admittedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    expectedDischarge: "2026-10-08",
    dischargedAt: null,
    status: "discharge_initiated",
    invoiceId: null,
    movements: [
      { wardId: "w-gen-01", wardName: "General Ward A", bedId: "bed-g02", bedNo: "G02", fromAt: new Date(Date.now() - 72 * 3600000).toISOString(), toAt: null, dailyTariff: 2800 },
    ],
    charges: [
      { id: "chg-03", serviceId: "svc-05", serviceName: "Nursing care per day", qty: 3, rate: 800, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), billed: false },
    ],
  },
];

// Invoices
export const invoices: any[] = [
  {
    id: "inv-01",
    code: "INV-2026-0104",
    postingDate: todayIso,
    patientId: "pat-01",
    patientName: "Ramesh Kumar Iyer",
    mrn: "HSP-00101",
    branchId: "br-chn-01",
    invoiceType: "opd",
    payerType: "insurance",
    insurer: "Star Health",
    preAuthNo: "SH-PA-8841",
    discountPercent: 10,
    discountReason: "Corporate privilege card",
    approvalThreshold: 15,
    discountApprovedBy: "usr-ms-01",
    approvedDiscountPercent: 10,
    approverName: "Dr. Kavitha Rao (MS)",
    grandTotal: 950,
    outstandingAmount: 950,
    status: "unpaid",
    items: [
      { serviceId: "svc-01", description: "Consultation - Dr. Arvind Menon", qty: 1, rate: 600, gstRate: 0 },
      { serviceId: "svc-06", description: "ECG 12-lead diagnostic", qty: 1, rate: 350, gstRate: 0 },
    ],
    payments: [],
  },
  {
    id: "inv-02",
    code: "INV-2026-0103",
    postingDate: "2026-10-05",
    patientId: "pat-02",
    patientName: "Ananya Sharma",
    mrn: "HSP-00102",
    branchId: "br-chn-01",
    invoiceType: "opd",
    payerType: "self",
    insurer: null,
    preAuthNo: null,
    discountPercent: 0,
    discountReason: null,
    approvalThreshold: 15,
    discountApprovedBy: null,
    approvedDiscountPercent: 0,
    approverName: null,
    grandTotal: 800,
    outstandingAmount: 0,
    status: "paid",
    items: [
      { serviceId: "svc-01", description: "Antenatal OPD Consultation - Dr. Farah Siddiqui", qty: 1, rate: 800, gstRate: 0 },
    ],
    payments: [
      { id: "pay-01", code: "RCP-2026-0089", amount: 800, mode: "upi", referenceNo: "UPI/20261005/98213", at: "2026-10-05T10:45:00.000Z", recordedBy: "Rahul (Billing)" },
    ],
  },
];

// Pharmacy POS Sales
export const pharmacySales: any[] = [
  {
    id: "sale-01",
    code: "PS-2026-0042",
    soldAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    patientId: "pat-01",
    patientName: "Ramesh Kumar Iyer",
    customerName: null,
    prescribingDoctor: "Dr. Arvind Menon",
    storeId: "str-pharm-01",
    paymentMode: "cash",
    netPayable: 330,
    items: [
      { itemId: "it-03", itemName: "Telmisartan 40 mg tab", qty: 30, rate: 11.0 },
    ],
  },
];

// Vendor Contracts & Plans
export const vendorSummary = {
  customers: 8,
  active: 7,
  grace: 1,
  suspended: 0,
  renewals30d: 2,
  receivable: 350000,
  overdue: 45000,
};

export const vendorPlans = [
  { id: "pl-01", name: "Hospital Essential", model: "subscription", billingCycle: "quarterly", price: 75000, amcPercent: 0, maxBranches: 1, maxUsers: 25, modules: ["patient_care", "inpatient", "revenue", "pharmacy"] },
  { id: "pl-02", name: "Hospital Enterprise", model: "subscription", billingCycle: "annual", price: 280000, amcPercent: 0, maxBranches: 3, maxUsers: 100, modules: ["patient_care", "inpatient", "revenue", "pharmacy", "inventory", "reports"] },
  { id: "pl-03", name: "Perpetual Standard", model: "perpetual_amc", billingCycle: "annual", price: 650000, amcPercent: 18, maxBranches: 2, maxUsers: 50, modules: ["patient_care", "inpatient", "revenue", "pharmacy", "inventory"] },
];

export const vendorCustomers = [
  { id: "cust-01", code: "CUST-001", name: "Sevana Healthcare Anna Nagar", city: "Chennai", beds: 24, gstin: "33AAAAA0000A1Z5", contactName: "Dr. Kavitha Rao", contactEmail: "admin@sevana.demo" },
  { id: "cust-02", code: "CUST-002", name: "PSG Hospitals Super Speciality", city: "Coimbatore", beds: 350, gstin: "33BBBBB1111B1Z6", contactName: "K. Rangarajan", contactEmail: "admin@psg.demo" },
  { id: "cust-03", code: "CUST-003", name: "Meenakshi Mission Hospital", city: "Madurai", beds: 180, gstin: "33CCCCC2222C1Z7", contactName: "Dr. N. Sethuraman", contactEmail: "admin@mmh.demo" },
];

export const vendorContracts = [
  { id: "cnt-01", code: "CTR-2026-0001", customerId: "cust-01", customerName: "Sevana Healthcare Anna Nagar", planId: "pl-02", planName: "Hospital Enterprise", amount: 280000, startDate: "2026-01-01", nextDue: "2027-01-01", keyValidUntil: "2027-01-15", status: "active", licenceKey: "SVN1.eyJjdXN0b21lciI6IlNldmFuYSIsImJyYW5jaGVzIjozLCJ1c2VycyI6MTAwLCJleHAiOiIyMDI3LTAxLTE1In0.dGVzdC1zaWduYXR1cmUtZXhhbXBsZQ==" },
  { id: "cnt-02", code: "CTR-2026-0002", customerId: "cust-02", customerName: "PSG Hospitals Super Speciality", planId: "pl-03", planName: "Perpetual Standard", amount: 650000, startDate: "2025-06-01", nextDue: "2026-10-15", keyValidUntil: "2026-10-30", status: "grace", licenceKey: "SVN1.eyJjdXN0b21lciI6IlBTRyIsImJyYW5jaGVzIjoyLCJ1c2VycyI6NTAsImV4cCI6IjIwMjYtMTAtMzAifQ.cHNnLXNpZ25hdHVyZQ==" },
];

// Audit Log
export const auditLogs: any[] = [
  { id: "aud-01", at: new Date(Date.now() - 10 * 60000).toISOString(), action: "login", entity: "user", entityId: "usr-admin-01", userEmail: "admin@sevana.demo", ip: "127.0.0.1", data: { client: "Next.js App" } },
  { id: "aud-02", at: new Date(Date.now() - 35 * 60000).toISOString(), action: "opd.vitals_update", entity: "opd_visit", entityId: "v-01", userEmail: "nurse@sevana.demo", ip: "127.0.0.1", data: { bp: "142/92", pulse: 84 } },
  { id: "aud-03", at: new Date(Date.now() - 55 * 60000).toISOString(), action: "appointment.check_in", entity: "appointment", entityId: "apt-01", userEmail: "frontdesk@sevana.demo", ip: "127.0.0.1", data: { token: "C-001" } },
  { id: "aud-04", at: new Date(Date.now() - 120 * 60000).toISOString(), action: "discount.approve", entity: "invoice", entityId: "inv-01", userEmail: "ms@sevana.demo", ip: "127.0.0.1", data: { discountPercent: 10 } },
];
