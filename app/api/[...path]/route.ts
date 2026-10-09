import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@sevana/shared";
import {
  DEMO_USERS,
  getPermissionsForRoles,
  branches,
  departments,
  doctors,
  services,
  wards,
  beds,
  stores,
  suppliers,
  items,
  patients,
  appointments,
  opdQueue,
  admissions,
  invoices,
  pharmacySales,
  vendorSummary,
  vendorPlans,
  vendorCustomers,
  vendorContracts,
  auditLogs,
} from "@/lib/mock-store";

function getCurrentUser(req: NextRequest) {
  const cookieEmail = req.cookies.get("sevana_sid")?.value;
  if (cookieEmail && DEMO_USERS[cookieEmail]) {
    return DEMO_USERS[cookieEmail];
  }
  return DEMO_USERS["admin@sevana.demo"];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = path.join("/");
  const url = req.nextUrl;
  const searchParams = url.searchParams;

  // 1. Auth & Session
  if (p === "auth/me") {
    const user = getCurrentUser(req);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      branchId: user.branchId,
      permissions: getPermissionsForRoles(user.roles),
      doctorId: user.doctorId,
      hospitalName: "Sevana Healthcare",
    });
  }

  // 2. Lookups
  if (p === "lookups") {
    return NextResponse.json({
      branches,
      departments,
      doctors: doctors.map((d) => ({ id: d.id, name: d.name, departmentId: d.departmentId, branchId: d.branchId, userId: d.userId })),
      services: services.map((s) => ({ id: s.id, name: s.name, code: s.code, rate: s.rate, category: s.category })),
      wards: wards.map((w) => ({ id: w.id, name: w.name, branchId: w.branchId })),
      stores: stores.map((s) => ({ id: s.id, name: s.name, storeType: s.storeType, branchId: s.branchId })),
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
      items: items.map((i) => ({ id: i.id, name: i.name, code: i.code, schedule: i.schedule, uom: i.uom })),
    });
  }

  // 3. Dashboard KPI metrics
  if (p === "dashboard") {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
    const availBeds = beds.filter((b) => b.status === "available").length;
    const cleanBeds = beds.filter((b) => b.status === "cleaning").length;

    return NextResponse.json({
      opd: {
        total: opdQueue.length + 8,
        waiting: opdQueue.filter((v) => ["waiting", "vitals"].includes(v.status)).length,
        in_consultation: opdQueue.filter((v) => v.status === "in_consultation").length,
      },
      appointments: {
        total: appointments.length + 4,
        pending: appointments.filter((a) => a.status === "scheduled").length,
      },
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availBeds,
        cleaning: cleanBeds,
      },
      admittedToday: 2,
      revenue: {
        collected_today: 48500,
        receipts: 18,
      },
      receivables: {
        outstanding: 34200,
        invoices: 4,
      },
      pendingApprovals: 1,
      stock: {
        low_stock: 1,
        near_expiry: 1,
      },
      pendingRx: 2,
    });
  }

  // 4. Patients
  if (p === "patients") {
    const q = searchParams.get("q")?.toLowerCase();
    let res = patients;
    if (q) {
      res = res.filter((pt) =>
        pt.fullName.toLowerCase().includes(q) ||
        pt.mrn.toLowerCase().includes(q) ||
        (pt.mobile && pt.mobile.includes(q)) ||
        (pt.abhaNumber && pt.abhaNumber.includes(q))
      );
    }
    return NextResponse.json(res);
  }

  if (p.startsWith("patients/")) {
    const id = p.split("/")[1];
    const pt = patients.find((x) => x.id === id);
    if (!pt) return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    return NextResponse.json(pt);
  }

  // 5. Appointments & Slots
  if (p === "appointments/slots") {
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    // Generate standard 15-min clinic slots from 09:00 to 13:00
    const times = ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45"];
    const bookedTimes = appointments.filter((a) => a.doctorId === doctorId && a.date === date).map((a) => a.time.slice(0, 5));
    const slots = times.map((t) => ({ time: t, available: !bookedTimes.includes(t) }));
    return NextResponse.json(slots);
  }

  if (p === "appointments") {
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");
    let res = appointments;
    if (date) res = res.filter((a) => a.date === date);
    if (doctorId) res = res.filter((a) => a.doctorId === doctorId);
    return NextResponse.json(res);
  }

  // 6. OPD
  if (p === "opd/queue") {
    const doctorId = searchParams.get("doctorId");
    let res = opdQueue;
    if (doctorId) res = res.filter((v) => v.doctorId === doctorId);
    return NextResponse.json(res);
  }

  if (p === "opd/e-prescriptions") {
    const active = opdQueue.filter((v) => v.prescription && v.prescription.length > 0);
    return NextResponse.json(
      active.map((v) => ({
        id: v.id,
        code: v.token,
        patientName: v.patientName,
        mrn: patients.find((p) => p.id === v.patientId)?.mrn ?? "",
        doctorName: v.doctorName,
        prescribedAt: v.consultationStartedAt ?? v.arrivedAt,
        itemsCount: v.prescription.length,
      }))
    );
  }

  if (p.startsWith("opd/")) {
    const id = p.split("/")[1];
    const visit = opdQueue.find((x) => x.id === id);
    if (!visit) return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    return NextResponse.json(visit);
  }

  // 7. IPD & Admissions
  if (p === "ipd/bed-board") {
    return NextResponse.json(wards);
  }

  if (p === "admissions") {
    const statusParam = searchParams.get("status");
    let res = admissions;
    if (statusParam) {
      const allowed = statusParam.split(",");
      res = res.filter((a) => allowed.includes(a.status));
    }
    return NextResponse.json(res);
  }

  if (p.startsWith("admissions/")) {
    const id = p.split("/")[1];
    const adm = admissions.find((x) => x.id === id);
    if (!adm) return NextResponse.json({ message: "Admission not found" }, { status: 404 });
    return NextResponse.json(adm);
  }

  if (p === "beds") {
    const wardId = searchParams.get("wardId");
    let res = beds;
    if (wardId) res = res.filter((b) => b.wardId === wardId);
    return NextResponse.json(res);
  }

  // 8. Billing & Invoices
  if (p === "invoices") {
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();
    let res = invoices;
    if (status) {
      const allowed = status.split(",");
      res = res.filter((i) => allowed.includes(i.status));
    }
    if (q) {
      res = res.filter((i) =>
        i.code.toLowerCase().includes(q) ||
        i.patientName.toLowerCase().includes(q) ||
        i.mrn.toLowerCase().includes(q)
      );
    }
    return NextResponse.json(res);
  }

  if (p.startsWith("invoices/")) {
    const id = p.split("/")[1];
    const inv = invoices.find((x) => x.id === id);
    if (!inv) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    return NextResponse.json(inv);
  }

  // 9. Pharmacy & Stock
  if (p === "pharmacy/sales") {
    return NextResponse.json(pharmacySales);
  }

  if (p.startsWith("pharmacy/prescription/")) {
    const id = p.split("/")[2];
    const visit = opdQueue.find((x) => x.id === id);
    if (!visit) return NextResponse.json({ message: "Prescription not found" }, { status: 404 });
    return NextResponse.json({
      patientId: visit.patientId,
      prescribingDoctor: visit.doctorName,
      items: (visit.prescription || []).map((rx: any) => {
        const item = items.find((i) => i.id === rx.itemId);
        return {
          itemId: rx.itemId,
          itemName: item?.name ?? "Medicine",
          qty: rx.qty ?? 10,
          available: 240,
        };
      }),
    });
  }

  if (p === "stock/status") {
    const storeId = searchParams.get("storeId");
    const near = searchParams.get("onlyNearExpiry") === "true";
    const res = items.map((it, idx) => ({
      id: `stk-${it.id}`,
      name: it.name,
      code: it.code,
      store: storeId ? stores.find((s) => s.id === storeId)?.name ?? "Main Store" : "Main Pharmacy CHN",
      batchNo: `B${idx + 1}26`,
      expiryDate: idx === 1 ? "2026-11-30" : "2027-08-31",
      flag: idx === 1 ? "near_expiry" : undefined,
      qty: idx === 0 ? 350 : idx === 1 ? 80 : 220,
      mrp: it.defaultMrp,
      value: (it.defaultMrp * 0.7 * (idx === 0 ? 350 : 200)).toFixed(2),
    }));
    return NextResponse.json(near ? res.filter((r) => r.flag === "near_expiry") : res);
  }

  if (p === "stock/reorder") {
    return NextResponse.json([
      { id: "it-02", name: "Amoxicillin 500 mg cap", code: "MED-AMOX500", onHand: 80, reorderLevel: 100, reorderQty: 500 },
    ]);
  }

  if (p === "purchase-orders") {
    return NextResponse.json([
      { id: "po-01", code: "PO-2026-0012", orderDate: "2026-10-04", supplierName: "MedPlus Distributors", storeName: "Main Pharmacy CHN", status: "approved", linesCount: 3 },
    ]);
  }

  if (p.startsWith("purchase-orders/")) {
    return NextResponse.json({
      id: "po-01",
      code: "PO-2026-0012",
      supplierId: "sup-01",
      storeId: "str-pharm-01",
      lines: [
        { itemId: "it-01", itemName: "Paracetamol 650 mg tab", qty: 500, rate: 2.1 },
        { itemId: "it-02", itemName: "Amoxicillin 500 mg cap", qty: 500, rate: 9.5 },
      ],
    });
  }

  if (p === "goods-receipts") {
    return NextResponse.json([
      { id: "grn-01", code: "GRN-2026-0008", date: "2026-10-02", supplierName: "MedPlus Distributors", storeName: "Main Pharmacy CHN", status: "received" },
    ]);
  }

  if (p === "stock-movements") {
    return NextResponse.json([
      { id: "mv-01", code: "MV-2026-0004", date: "2026-10-03", fromStoreName: "Central Store CHN", toStoreName: "Main Pharmacy CHN", reason: "Pharmacy stock replenishment", status: "completed" },
    ]);
  }

  if (p.startsWith("stock/items/") && p.endsWith("/batches")) {
    const parts = p.split("/");
    const itemId = parts[2];
    const item = items.find((i) => i.id === itemId);
    return NextResponse.json([
      { id: "bat-01", batchNo: "A126", expiryDate: "2027-06-30", qty: 150, mrp: item?.defaultMrp ?? 10 },
    ]);
  }

  // 10. Admin Masters
  if (p === "branches") return NextResponse.json(branches);
  if (p === "departments") return NextResponse.json(departments);
  if (p === "services") return NextResponse.json(services);
  if (p === "wards") return NextResponse.json(wards);
  if (p === "stores") return NextResponse.json(stores);
  if (p === "stock-items") return NextResponse.json(items);
  if (p === "suppliers") return NextResponse.json(suppliers);
  if (p === "doctors") return NextResponse.json(doctors);
  if (p === "users") {
    return NextResponse.json(
      Object.values(DEMO_USERS).map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        roles: u.roles,
        branchId: u.branchId,
        isActive: true,
      }))
    );
  }

  if (p === "settings") {
    return NextResponse.json({
      hospitalName: "Sevana Healthcare",
      discountApprovalThreshold: 15,
      pharmacyMaxDiscount: 10,
      minBedChargeDays: 1,
      bedChargeGraceHours: 2,
      enforceLicence: true,
      licenceKey: "SVN1.demo-enterprise-key.valid",
    });
  }

  if (p === "audit-log") {
    const entity = searchParams.get("entity");
    let res = auditLogs;
    if (entity) res = res.filter((a) => a.entity === entity);
    return NextResponse.json(res);
  }

  // 11. Vendor Console
  if (p === "vendor/summary") return NextResponse.json(vendorSummary);
  if (p === "vendor/contracts") return NextResponse.json(vendorContracts);
  if (p === "vendor/plans") return NextResponse.json(vendorPlans);
  if (p === "vendor/customers") return NextResponse.json(vendorCustomers);

  if (p.startsWith("vendor/contracts/")) {
    const id = p.split("/")[2];
    const c = vendorContracts.find((x) => x.id === id);
    if (!c) return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    return NextResponse.json(c);
  }

  return NextResponse.json({ message: `Path /api/${p} not found` }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = path.join("/");
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Auth Login / Register / Logout
  if (p === "auth/login") {
    const email = body.email?.toLowerCase().trim();
    const user = DEMO_USERS[email] || {
      id: `usr-${Date.now()}`,
      email: body.email || "user@sevana.demo",
      fullName: body.email ? body.email.split("@")[0].toUpperCase() : "Hospital Staff",
      roles: ["admin"] as Role[],
      branchId: "br-chn-01",
      doctorId: null,
    };
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("sevana_sid", user.email, { path: "/", httpOnly: false, sameSite: "lax" });
    return res;
  }

  if (p === "auth/register") {
    const email = body.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    const fullName = body.fullName?.trim() || email.split("@")[0];
    const role = (body.role || "doctor") as Role;
    const user = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      roles: [role],
      branchId: body.branchId || "br-chn-01",
      doctorId: role === "doctor" ? "doc-menon-01" : null,
    };
    DEMO_USERS[email] = user;
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("sevana_sid", user.email, { path: "/", httpOnly: false, sameSite: "lax" });
    return res;
  }

  if (p === "auth/logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("sevana_sid");
    return res;
  }

  // 2. Patients
  if (p === "patients") {
    const newId = `pat-${Date.now()}`;
    const nextNum = patients.length + 101;
    const newPt = {
      id: newId,
      mrn: `HSP-00${nextNum}`,
      fullName: `${body.firstName} ${body.lastName ?? ""}`.trim(),
      ...body,
      age: body.approxAge ? `${body.approxAge} y` : "30 y",
      createdAt: new Date().toISOString(),
      visits: [],
      admissions: [],
      invoices: [],
    };
    patients.unshift(newPt);
    return NextResponse.json(newPt);
  }

  // 3. Appointments
  if (p === "appointments") {
    const patient = patients.find((pt) => pt.id === body.patientId);
    const doc = doctors.find((d) => d.id === body.doctorId);
    const newApt = {
      id: `apt-${Date.now()}`,
      date: body.date,
      time: `${body.time}:00`,
      doctorId: body.doctorId,
      doctorName: doc?.name ?? "Doctor",
      patientId: body.patientId,
      patientName: patient?.fullName ?? "Patient",
      mrn: patient?.mrn ?? "",
      type: body.type || "new",
      status: "scheduled",
      opdVisitId: null,
    };
    appointments.push(newApt);
    return NextResponse.json(newApt);
  }

  if (p.startsWith("appointments/")) {
    const parts = p.split("/");
    const id = parts[1];
    const action = parts[2];
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

    if (action === "check-in") {
      apt.status = "checked_in";
      const token = `T-00${opdQueue.length + 1}`;
      const visitId = `v-${Date.now()}`;
      apt.opdVisitId = visitId;
      opdQueue.push({
        id: visitId,
        token,
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        patientId: apt.patientId,
        patientName: apt.patientName,
        ageSex: "40 y / M",
        priority: "normal",
        status: "waiting",
        arrivedAt: new Date().toISOString(),
        prescription: [],
        diagnoses: [],
      });
      return NextResponse.json({ ok: true, token, visitId });
    }
    if (action === "no-show") {
      apt.status = "no_show";
      return NextResponse.json({ ok: true });
    }
    if (action === "cancel") {
      apt.status = "cancelled";
      return NextResponse.json({ ok: true });
    }
  }

  // 4. OPD Actions
  if (p === "opd") {
    const pt = patients.find((x) => x.id === body.patientId);
    const doc = doctors.find((x) => x.id === body.doctorId);
    const visitId = `v-${Date.now()}`;
    const token = `${doc?.code?.[0] ?? "C"}-00${opdQueue.length + 1}`;
    const newVisit = {
      id: visitId,
      token,
      doctorId: body.doctorId,
      doctorName: doc?.name ?? "Doctor",
      patientId: body.patientId,
      patientName: pt?.fullName ?? "Walk-in Patient",
      ageSex: "35 y / M",
      priority: body.priority || "normal",
      status: "waiting",
      arrivedAt: new Date().toISOString(),
      bpSystolic: null,
      bpDiastolic: null,
      pulse: null,
      temperature: null,
      spo2: null,
      respiratoryRate: null,
      prescription: [],
      diagnoses: [],
    };
    opdQueue.unshift(newVisit);
    return NextResponse.json(newVisit);
  }

  if (p.startsWith("opd/") && p.endsWith("/status")) {
    const id = p.split("/")[1];
    const visit = opdQueue.find((x) => x.id === id);
    if (visit) {
      visit.status = body.status;
      if (body.status === "in_consultation" && !visit.consultationStartedAt) {
        visit.consultationStartedAt = new Date().toISOString();
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("opd/") && p.endsWith("/complete")) {
    const id = p.split("/")[1];
    const visit = opdQueue.find((x) => x.id === id);
    if (visit) visit.status = "completed";
    return NextResponse.json({ ok: true, invoiceId: "inv-01" });
  }

  // 5. Inpatient / IPD Admissions
  if (p === "admissions") {
    const pt = patients.find((x) => x.id === body.patientId);
    const doc = doctors.find((x) => x.id === body.doctorId);
    const ward = wards.find((x) => x.id === body.wardId);
    const bed = beds.find((x) => x.id === body.bedId);
    if (bed) {
      bed.status = "occupied";
      bed.patientName = pt?.fullName;
    }
    const newAdm = {
      id: `adm-${Date.now()}`,
      code: `IP-2026-00${admissions.length + 50}`,
      patientId: body.patientId,
      patient: pt,
      doctorId: body.doctorId,
      doctorName: doc?.name ?? "Attending Doctor",
      admissionType: body.admissionType || "elective",
      reason: body.reason,
      provisionalDiagnosis: body.provisionalDiagnosis,
      admittedAt: new Date().toISOString(),
      expectedDischarge: body.expectedDischarge,
      status: "admitted",
      invoiceId: null,
      movements: [
        { wardId: body.wardId, wardName: ward?.name, bedId: body.bedId, bedNo: bed?.bedNo, fromAt: new Date().toISOString(), toAt: null, dailyTariff: ward?.dailyTariff ?? 2800 },
      ],
      charges: [],
    };
    admissions.unshift(newAdm);
    return NextResponse.json(newAdm);
  }

  if (p.startsWith("admissions/") && p.endsWith("/initiate-discharge")) {
    const id = p.split("/")[1];
    const adm = admissions.find((x) => x.id === id);
    if (adm) adm.status = "discharge_initiated";
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("admissions/") && p.endsWith("/discharge")) {
    const id = p.split("/")[1];
    const adm = admissions.find((x) => x.id === id);
    if (adm) {
      adm.status = "completed";
      adm.dischargedAt = new Date().toISOString();
      const currentMov = adm.movements.find((m: any) => !m.toAt);
      if (currentMov) {
        currentMov.toAt = new Date().toISOString();
        const bed = beds.find((b) => b.id === currentMov.bedId);
        if (bed) {
          bed.status = "cleaning";
          bed.patientName = null;
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("beds/") && p.endsWith("/status")) {
    const id = p.split("/")[1];
    const bed = beds.find((b) => b.id === id);
    if (bed) bed.status = body.status;
    return NextResponse.json({ ok: true });
  }

  if (p === "beds") {
    const newBed = {
      id: `bed-${Date.now()}`,
      wardId: body.wardId,
      bedNo: body.bedNo,
      status: "available",
      currentAdmissionId: null,
      patientName: null,
      admissionCode: null,
    };
    beds.push(newBed);
    const ward = wards.find((w) => w.id === body.wardId);
    if (ward) ward.beds.push(newBed);
    return NextResponse.json(newBed);
  }

  // 6. Invoices & Billing
  if (p === "invoices") {
    const pt = patients.find((x) => x.id === body.patientId);
    const invId = `inv-${Date.now()}`;
    const newInv = {
      id: invId,
      code: `INV-2026-0${invoices.length + 110}`,
      postingDate: new Date().toISOString().slice(0, 10),
      patientId: body.patientId,
      patientName: pt?.fullName ?? "Patient",
      mrn: pt?.mrn ?? "",
      branchId: body.branchId,
      invoiceType: body.invoiceType || "other",
      payerType: body.payerType || "self",
      insurer: body.insurer,
      preAuthNo: body.preAuthNo,
      discountPercent: body.discountPercent || 0,
      approvalThreshold: 15,
      grandTotal: 1200,
      outstandingAmount: 1200,
      status: "draft",
      items: body.items || [{ serviceId: "svc-01", description: "OPD Consultation", qty: 1, rate: 600, gstRate: 0 }],
      payments: [],
    };
    invoices.unshift(newInv);
    return NextResponse.json(newInv);
  }

  if (p.startsWith("invoices/") && p.endsWith("/finalize")) {
    const id = p.split("/")[1];
    const inv = invoices.find((i) => i.id === id);
    if (inv) inv.status = "unpaid";
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("invoices/") && p.endsWith("/approve-discount")) {
    const id = p.split("/")[1];
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      inv.discountApprovedBy = "usr-ms-01";
      inv.approvedDiscountPercent = inv.discountPercent;
      inv.approverName = "Dr. Kavitha Rao (MS)";
    }
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("invoices/") && p.endsWith("/cancel")) {
    const id = p.split("/")[1];
    const inv = invoices.find((i) => i.id === id);
    if (inv) inv.status = "cancelled";
    return NextResponse.json({ ok: true });
  }

  if (p === "payments") {
    const inv = invoices.find((i) => i.id === body.invoiceId);
    const code = `RCP-2026-0${Date.now().toString().slice(-4)}`;
    const pay = {
      id: `pay-${Date.now()}`,
      code,
      amount: Number(body.amount),
      mode: body.mode,
      referenceNo: body.referenceNo,
      at: new Date().toISOString(),
      recordedBy: "Billing Counter",
    };
    if (inv) {
      inv.payments.push(pay);
      inv.outstandingAmount = Math.max(0, inv.outstandingAmount - pay.amount);
      inv.status = inv.outstandingAmount === 0 ? "paid" : "partly_paid";
    }
    return NextResponse.json({ ok: true, code, payment: pay });
  }

  // 7. Pharmacy
  if (p === "pharmacy/sales") {
    const code = `PS-2026-0${pharmacySales.length + 50}`;
    const newSale = {
      id: `ps-${Date.now()}`,
      code,
      soldAt: new Date().toISOString(),
      customerName: body.customerName,
      patientId: body.patientId,
      patientName: body.patientId ? patients.find((p) => p.id === body.patientId)?.fullName : body.customerName,
      prescribingDoctor: body.prescribingDoctor,
      paymentMode: body.paymentMode,
      netPayable: 450,
      items: body.items,
    };
    pharmacySales.unshift(newSale);
    return NextResponse.json(newSale);
  }

  // 8. Purchase Orders & GRN
  if (p === "purchase-orders") {
    const code = `PO-2026-00${Date.now().toString().slice(-2)}`;
    return NextResponse.json({ id: `po-${Date.now()}`, code, status: "draft" });
  }

  if (p === "goods-receipts") {
    const code = `GRN-2026-00${Date.now().toString().slice(-2)}`;
    return NextResponse.json({ id: `grn-${Date.now()}`, code, status: "received" });
  }

  if (p === "stock-movements") {
    const code = `MV-2026-00${Date.now().toString().slice(-2)}`;
    return NextResponse.json({ id: `mv-${Date.now()}`, code, status: "completed" });
  }

  // 9. Vendor Console
  if (p === "vendor/contracts") {
    const code = `CTR-2026-00${vendorContracts.length + 10}`;
    const cust = vendorCustomers.find((c) => c.id === body.customerId);
    const plan = vendorPlans.find((pl) => pl.id === body.planId);
    const newCtr = {
      id: `cnt-${Date.now()}`,
      code,
      customerId: body.customerId,
      customerName: cust?.name ?? "Hospital",
      planId: body.planId,
      planName: plan?.name ?? "Plan",
      amount: plan?.price ?? 100000,
      startDate: body.startDate,
      nextDue: body.endDate || "2027-01-01",
      keyValidUntil: "2027-01-15",
      status: "active",
      licenceKey: `SVN1.${Buffer.from(JSON.stringify({ hospital: cust?.name, exp: "2027-01-15" })).toString("base64")}.demo_signature`,
    };
    vendorContracts.unshift(newCtr);
    return NextResponse.json(newCtr);
  }

  if (p.startsWith("vendor/contracts/") && p.endsWith("/generate-key")) {
    return NextResponse.json({
      licenceKey: `SVN1.${Buffer.from(JSON.stringify({ valid: true, timestamp: Date.now() })).toString("base64")}.sig_${Date.now()}`,
    });
  }

  // Default POST success for masters
  return NextResponse.json({ ok: true, id: `rec-${Date.now()}`, ...body });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = path.join("/");
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (p.startsWith("patients/")) {
    const id = p.split("/")[1];
    const pt = patients.find((x) => x.id === id);
    if (pt) {
      Object.assign(pt, body);
      if (body.firstName) pt.fullName = `${body.firstName} ${body.lastName ?? ""}`.trim();
    }
    return NextResponse.json(pt || { ok: true });
  }

  if (p.startsWith("opd/")) {
    const id = p.split("/")[1];
    const visit = opdQueue.find((x) => x.id === id);
    if (visit) Object.assign(visit, body);
    return NextResponse.json(visit || { ok: true });
  }

  if (p.startsWith("admissions/") && p.endsWith("/notes")) {
    const id = p.split("/")[1];
    const adm = admissions.find((x) => x.id === id);
    if (adm) Object.assign(adm, body);
    return NextResponse.json({ ok: true });
  }

  if (p.startsWith("invoices/")) {
    const id = p.split("/")[1];
    const inv = invoices.find((x) => x.id === id);
    if (inv) Object.assign(inv, body);
    return NextResponse.json(inv || { ok: true });
  }

  return NextResponse.json({ ok: true, ...body });
}
