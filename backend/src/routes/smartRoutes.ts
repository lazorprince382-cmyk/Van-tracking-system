import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";

export const smartRoutesRouter = Router();
smartRoutesRouter.use(staffAuth());

const periodSchema = z.enum(["MORNING", "AFTERNOON", "EVENING"]);
async function allowedVan(userId: string, role: string, organizationId: string, vanId: string) {
  if (role === "DRIVER") return Boolean(await prisma.user.findFirst({ where: { id: userId, assignedVanId: vanId }, select: { id: true } }));
  return Boolean(await prisma.van.findFirst({ where: { id: vanId, organizationId }, select: { id: true } }));
}
function dayRange() { const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return { start, end }; }

smartRoutesRouter.get("/smart-routes/:vanId", async (req, res) => {
  const parsed = periodSchema.safeParse(req.query.period);
  if (!parsed.success) return res.status(400).json({ error: "Select a valid route round" });
  const staff = req.staff!; const vanId = String(req.params.vanId);
  if (!(await allowedVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });
  const eventType = parsed.data === "MORNING" ? "PICKUP" : "DROP_OFF";
  const { start, end } = dayRange();
  const [assignments, events, livePosition] = await Promise.all([
    prisma.transportAssignment.findMany({ where: { vanId, period: parsed.data }, orderBy: [{ stopOrder: "asc" }, { createdAt: "asc" }], select: { id: true, stopOrder: true, child: { select: { id: true, firstName: true, lastName: true, className: true, residenceRoute: true, photoData: true, stopLabel: true, homeLat: true, homeLon: true, parentPhone: true } } } }),
    prisma.childEvent.findMany({ where: { organizationId: staff.organizationId, occurredAt: { gte: start, lt: end }, trip: { vanId }, OR: [{ eventType }, { eventType: "PRESENT", notes: { contains: parsed.data } }, { eventType: "ABSENT", notes: { contains: parsed.data } }] }, select: { childId: true, eventType: true, occurredAt: true, notes: true } }),
    prisma.vanLivePosition.findUnique({ where: { vanId }, select: { lat: true, lon: true, timestamp: true } }),
  ]);
  const presentChildIds = new Set(events.filter((event) => event.eventType === "PRESENT" && (!event.notes || event.notes.includes(parsed.data))).map((event) => event.childId));
  const absentForRoundIds = new Set(events.filter((event) => event.eventType === "ABSENT" && (!event.notes || event.notes.includes(parsed.data))).map((event) => event.childId));
  const visibleAssignments = parsed.data === "MORNING" ? assignments : assignments.filter((assignment) => presentChildIds.has(assignment.child.id) && !absentForRoundIds.has(assignment.child.id));
  const stops = visibleAssignments.map((assignment, index) => { const completed = events.find((event) => event.childId === assignment.child.id && (event.eventType === eventType || event.eventType === "ABSENT")); return { assignmentId: assignment.id, order: assignment.stopOrder || index + 1, ...assignment.child, completedAt: completed?.occurredAt ?? null, attendanceStatus: completed?.eventType === "ABSENT" ? "ABSENT" : completed ? "PRESENT" : null }; });
  const currentIndex = stops.findIndex((stop) => !stop.completedAt);
  res.json({ period: parsed.data, eventType, livePosition, stops, currentIndex, completedCount: stops.filter((stop) => stop.completedAt).length });
});

const stopSchema = z.object({ lat: z.number().min(-90).max(90).optional(), lon: z.number().min(-180).max(180).optional(), stopLabel: z.string().max(150).optional() });
smartRoutesRouter.post("/smart-routes/:vanId/children/:childId/location", async (req, res) => {
  const parsed = stopSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Invalid stop location" });
  const staff = req.staff!; const vanId = String(req.params.vanId); const childId = String(req.params.childId);
  if (!(await allowedVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });
  const assignment = await prisma.transportAssignment.findFirst({ where: { vanId, childId, child: { organizationId: staff.organizationId } }, select: { id: true } });
  if (!assignment) return res.status(404).json({ error: "Child is not assigned to this van" });
  const live = parsed.data.lat !== undefined && parsed.data.lon !== undefined ? { lat: parsed.data.lat, lon: parsed.data.lon } : await prisma.vanLivePosition.findUnique({ where: { vanId }, select: { lat: true, lon: true } });
  if (!live) return res.status(400).json({ error: "No live van GPS is available. Update the van location first." });
  const child = await prisma.child.update({ where: { id: childId }, data: { homeLat: live.lat, homeLon: live.lon, stopLabel: parsed.data.stopLabel }, select: { id: true, homeLat: true, homeLon: true, stopLabel: true } });
  res.json({ child });
});

const completionSchema = z.object({ childId: z.string().min(1), period: periodSchema, attendanceStatus: z.enum(["PRESENT", "ABSENT"]).default("PRESENT") });
smartRoutesRouter.post("/smart-routes/:vanId/complete", async (req, res) => {
  const parsed = completionSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Invalid stop completion" });
  const staff = req.staff!; const vanId = String(req.params.vanId);
  if (!(await allowedVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });
  const assignment = await prisma.transportAssignment.findFirst({ where: { vanId, childId: parsed.data.childId, period: parsed.data.period }, select: { id: true } });
  if (!assignment) return res.status(404).json({ error: "This child is not part of the selected round" });
  const eventType = parsed.data.attendanceStatus === "ABSENT" ? "ABSENT" : parsed.data.period === "MORNING" ? "PICKUP" : "DROP_OFF"; const { start, end } = dayRange();
  const existing = await prisma.childEvent.findFirst({ where: { childId: parsed.data.childId, occurredAt: { gte: start, lt: end }, trip: { vanId }, OR: [{ eventType: parsed.data.period === "MORNING" ? "PICKUP" : "DROP_OFF" }, { eventType: "ABSENT", notes: { contains: parsed.data.period } }] } });
  if (existing) return res.status(409).json({ error: "This stop is already completed" });
  const trip = await prisma.trip.findFirst({ where: { organizationId: staff.organizationId, vanId, startTime: { gte: start, lt: end }, endTime: null }, select: { id: true } });
  if (!trip) return res.status(400).json({ error: "Start the journey first so this confirmation is saved under the correct route." });
  const event = await prisma.childEvent.create({ data: { organizationId: staff.organizationId, tripId: trip.id, childId: parsed.data.childId, eventType, occurredAt: new Date(), notes: parsed.data.attendanceStatus === "ABSENT" ? `ABSENT:${parsed.data.period} - Child was not available at door/van` : `PRESENT:${parsed.data.period} - Confirmed from smart route` }, select: { id: true, occurredAt: true } });
  res.status(201).json({ event });
});

const orderSchema = z.object({ period: periodSchema, childIds: z.array(z.string()).min(1) });
smartRoutesRouter.put("/smart-routes/:vanId/order", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Invalid stop order" });
  const staff = req.staff!; const vanId = String(req.params.vanId);
  if (!(await allowedVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });
  await prisma.$transaction(parsed.data.childIds.map((childId, index) => prisma.transportAssignment.updateMany({ where: { vanId, childId, period: parsed.data.period }, data: { stopOrder: index + 1 } })));
  res.json({ ok: true });
});
