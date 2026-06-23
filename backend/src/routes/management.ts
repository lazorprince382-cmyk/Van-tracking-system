import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";

export const managementRouter = Router();

managementRouter.get("/settings", staffAuth(["ADMIN"]), async (req, res) => {
  const organizationId = req.staff!.organizationId;
  const [organization, drivers] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, name: true, phone: true, address: true, contactEmail: true, schoolStartTime: true, pickupGraceMinutes: true } }),
    prisma.user.findMany({ where: { organizationId, role: "DRIVER" }, select: { id: true, email: true, fullName: true, phone: true, assignedVanId: true, assignedVan: { select: { name: true } }, createdAt: true }, orderBy: { fullName: "asc" } }),
  ]);
  res.json({ organization, drivers });
});

const organizationSchema = z.object({ name: z.string().min(1).max(120), phone: z.string().max(30).optional(), address: z.string().max(200).optional(), contactEmail: z.string().email().or(z.literal("")).optional(), schoolStartTime: z.string().max(10).optional(), pickupGraceMinutes: z.number().int().min(0).max(120) });
managementRouter.patch("/settings/organization", staffAuth(["ADMIN"]), async (req, res) => {
  const parsed = organizationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the school settings" });
  const organization = await prisma.organization.update({ where: { id: req.staff!.organizationId }, data: parsed.data });
  res.json({ organization });
});

const driverSchema = z.object({ fullName: z.string().min(2).max(100), email: z.string().email(), phone: z.string().min(5).max(30), password: z.string().min(6).max(100), assignedVanId: z.string().min(1) });
managementRouter.post("/settings/drivers", staffAuth(["ADMIN"]), async (req, res) => {
  const parsed = driverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Complete all driver account fields" });
  const organizationId = req.staff!.organizationId;
  const van = await prisma.van.findFirst({ where: { id: parsed.data.assignedVanId, organizationId }, select: { id: true } });
  if (!van) return res.status(400).json({ error: "Selected van was not found" });
  const duplicate = await prisma.user.findFirst({ where: { organizationId, email: parsed.data.email } });
  if (duplicate) return res.status(409).json({ error: "An account already uses this email" });
  const driver = await prisma.user.create({ data: { organizationId, role: "DRIVER", fullName: parsed.data.fullName, email: parsed.data.email, phone: parsed.data.phone, passwordHash: await bcrypt.hash(parsed.data.password, 10), assignedVanId: van.id }, select: { id: true, email: true, fullName: true } });
  res.status(201).json({ driver });
});

managementRouter.delete("/settings/drivers/:driverId", staffAuth(["ADMIN"]), async (req, res) => {
  const result = await prisma.user.deleteMany({ where: { id: String(req.params.driverId), organizationId: req.staff!.organizationId, role: "DRIVER" } });
  if (!result.count) return res.status(404).json({ error: "Driver account not found" });
  res.status(204).send();
});

managementRouter.get("/history", staffAuth(), async (req, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
  const vanId = typeof req.query.vanId === "string" ? req.query.vanId : undefined;
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  if (Number.isNaN(start.valueOf())) return res.status(400).json({ error: "Invalid date" });
  const organizationId = req.staff!.organizationId;
  const driver = req.staff!.role === "DRIVER" ? await prisma.user.findUnique({ where: { id: req.staff!.userId }, select: { assignedVanId: true } }) : null;
  const effectiveVanId = req.staff!.role === "DRIVER" ? driver?.assignedVanId || "__no_assigned_van__" : vanId;
  const assignments = await prisma.transportAssignment.findMany({
    where: { ...(effectiveVanId ? { vanId: effectiveVanId } : {}), child: { organizationId } },
    select: { period: true, vanId: true, van: { select: { name: true } }, child: { select: { id: true, firstName: true, lastName: true, className: true, residenceRoute: true, parentPhone: true, photoData: true } } },
  });
  const events = await prisma.childEvent.findMany({
    where: { organizationId, occurredAt: { gte: start, lte: end }, ...(effectiveVanId ? { trip: { vanId: effectiveVanId } } : {}) },
    select: { childId: true, eventType: true, occurredAt: true, notes: true, trip: { select: { vanId: true, van: { select: { name: true } } } } }, orderBy: { occurredAt: "asc" },
  });
  const uniqueAssignments = assignments.filter((assignment, index, all) => all.findIndex((item) => item.child.id === assignment.child.id && item.vanId === assignment.vanId) === index);
  const records = uniqueAssignments.map((assignment) => {
    const childEvents = events.filter((event) => event.childId === assignment.child.id && event.trip.vanId === assignment.vanId);
    const pickup = childEvents.find((event) => event.eventType === "PICKUP");
    const dropoff = [...childEvents].reverse().find((event) => event.eventType === "DROP_OFF");
    const periods = assignments.filter((item) => item.child.id === assignment.child.id && item.vanId === assignment.vanId).map((item) => item.period);
    const absent = childEvents.find((event) => event.eventType === "ABSENT" && (!event.notes || event.notes.includes(assignment.period)));
    const present = childEvents.find((event) => event.eventType === "PRESENT" && (!event.notes || event.notes.includes(assignment.period)));
    return { childId: assignment.child.id, childName: `${assignment.child.firstName} ${assignment.child.lastName}`, firstName: assignment.child.firstName, lastName: assignment.child.lastName, className: assignment.child.className, residenceRoute: assignment.child.residenceRoute, parentPhone: assignment.child.parentPhone, photoData: assignment.child.photoData, vanId: assignment.vanId, vanName: assignment.van.name, period: assignment.period, periods, pickupTime: pickup?.occurredAt ?? null, dropoffTime: dropoff?.occurredAt ?? null, presentTime: present?.occurredAt ?? null, absentTime: absent?.occurredAt ?? null, status: absent ? "ABSENT" : dropoff ? "DROPPED_OFF" : pickup ? "PICKED_UP" : present ? "PRESENT" : "NOT_RECORDED", notes: absent?.notes || dropoff?.notes || pickup?.notes || present?.notes || null };
  });
  res.json({ date, records });
});

const attendanceSchema = z.object({ childId: z.string().min(1), vanId: z.string().min(1), eventType: z.enum(["PICKUP", "DROP_OFF", "ABSENT", "PRESENT"]), period: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional() });
managementRouter.post("/history/events", staffAuth(), async (req, res) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid attendance entry" });
  const staff = req.staff!;
  if (staff.role === "DRIVER") {
    const driver = await prisma.user.findUnique({ where: { id: staff.userId }, select: { assignedVanId: true } });
    if (driver?.assignedVanId !== parsed.data.vanId) return res.status(403).json({ error: "This learner is not assigned to your van" });
  }
  const assignment = await prisma.transportAssignment.findFirst({ where: { childId: parsed.data.childId, vanId: parsed.data.vanId, child: { organizationId: staff.organizationId } } });
  if (!assignment) return res.status(404).json({ error: "Learner is not assigned to this van" });
  const now = new Date(); const start = new Date(now); start.setHours(0, 0, 0, 0);
  let trip = await prisma.trip.findFirst({ where: { organizationId: staff.organizationId, vanId: parsed.data.vanId, startTime: { gte: start }, endTime: null }, select: { id: true } });
  if (!trip) trip = await prisma.trip.create({ data: { organizationId: staff.organizationId, vanId: parsed.data.vanId, routeName: "Daily school round", createdByUserId: staff.userId }, select: { id: true } });
  const existing = await prisma.childEvent.findFirst({ where: { tripId: trip.id, childId: parsed.data.childId, OR: [{ eventType: parsed.data.eventType }, ...(parsed.data.period ? [{ eventType: "ABSENT" as const, notes: { contains: parsed.data.period } }] : [])] } });
  if (existing) return res.status(409).json({ error: `${parsed.data.eventType === "PICKUP" ? "Pickup" : "Drop-off"} already recorded today` });
  if (parsed.data.eventType === "DROP_OFF") {
    const pickup = await prisma.childEvent.findFirst({ where: { tripId: trip.id, childId: parsed.data.childId, eventType: "PICKUP" } });
    if (!pickup) return res.status(400).json({ error: "Record the pickup before the drop-off" });
  }
  const event = await prisma.childEvent.create({ data: { organizationId: staff.organizationId, tripId: trip.id, childId: parsed.data.childId, eventType: parsed.data.eventType, occurredAt: now, notes: parsed.data.eventType === "ABSENT" ? `ABSENT:${parsed.data.period || "GENERAL"} - Child was not available at door/van` : parsed.data.eventType === "PRESENT" ? `PRESENT:${parsed.data.period || "GENERAL"} - Child confirmed inside van` : undefined }, select: { id: true, occurredAt: true } });
  res.status(201).json({ event });
});
