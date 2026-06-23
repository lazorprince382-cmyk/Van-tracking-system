import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";
import { getTripDistanceMeters } from "../services/distance";

export const tripsRouter = Router();

tripsRouter.use(staffAuth());

const createTripSchema = z.object({
  vanId: z.string().min(1),
  routeName: z.string().max(120).optional(),
  startTime: z.coerce.date().optional(),
});

async function canUseVan(userId: string, role: string, organizationId: string, vanId: string) {
  if (role === "DRIVER") return Boolean(await prisma.user.findFirst({ where: { id: userId, assignedVanId: vanId }, select: { id: true } }));
  return Boolean(await prisma.van.findFirst({ where: { id: vanId, organizationId }, select: { id: true } }));
}

tripsRouter.post("/", async (req, res) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const staff = req.staff!;
  const { vanId, routeName, startTime } = parsed.data;

  if (!(await canUseVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });

  const openTrip = await prisma.trip.findFirst({
    where: { organizationId: staff.organizationId, vanId, endTime: null },
    select: { id: true, vanId: true, routeName: true, startTime: true, endTime: true },
    orderBy: { startTime: "desc" },
  });
  if (openTrip) return res.status(409).json({ error: "This van already has an active journey. Stop it before starting another.", trip: openTrip });

  const trip = await prisma.trip.create({
    data: {
      organizationId: staff.organizationId,
      vanId,
      routeName,
      startTime: startTime ?? new Date(),
      createdByUserId: staff.userId,
    },
    select: { id: true, vanId: true, routeName: true, startTime: true, endTime: true },
  });

  res.status(201).json({ trip });
});

tripsRouter.get("/", async (req, res) => {
  const staff = req.staff!;
  const vanId = typeof req.query.vanId === "string" ? req.query.vanId : undefined;
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const start = date ? new Date(`${date}T00:00:00.000Z`) : undefined;
  const end = date ? new Date(`${date}T23:59:59.999Z`) : undefined;
  const driver = staff.role === "DRIVER" ? await prisma.user.findUnique({ where: { id: staff.userId }, select: { assignedVanId: true } }) : null;
  const effectiveVanId = staff.role === "DRIVER" ? driver?.assignedVanId || "__no_assigned_van__" : vanId;
  const trips = await prisma.trip.findMany({
    where: { organizationId: staff.organizationId, ...(effectiveVanId ? { vanId: effectiveVanId } : {}), ...(start && end ? { startTime: { gte: start, lte: end } } : {}) },
    select: {
      id: true, vanId: true, routeName: true, startTime: true, endTime: true,
      van: { select: { name: true, plateNumber: true, routeName: true } },
      telemetryPoints: { select: { id: true, lat: true, lon: true, timestamp: true }, orderBy: { timestamp: "asc" } },
      childEvents: { select: { id: true, eventType: true, occurredAt: true, notes: true, child: { select: { id: true, firstName: true, lastName: true, className: true, residenceRoute: true, photoData: true } } }, orderBy: { occurredAt: "asc" } },
    },
    orderBy: { startTime: "desc" },
    take: 60,
  });
  const withSummary = await Promise.all(trips.map(async (trip) => ({ ...trip, summary: { distanceMeters: await getTripDistanceMeters(trip.id), distanceKm: Number(((await getTripDistanceMeters(trip.id)) / 1000).toFixed(2)), childEventsCount: trip.childEvents.length } })));
  res.json({ trips: withSummary });
});

tripsRouter.get("/active", async (req, res) => {
  const staff = req.staff!;
  const vanId = typeof req.query.vanId === "string" ? req.query.vanId : "";
  if (!vanId) return res.status(400).json({ error: "Van is required" });
  if (!(await canUseVan(staff.userId, staff.role, staff.organizationId, vanId))) return res.status(403).json({ error: "Van access denied" });
  const trip = await prisma.trip.findFirst({
    where: { organizationId: staff.organizationId, vanId, endTime: null },
    select: { id: true, vanId: true, routeName: true, startTime: true, endTime: true },
    orderBy: { startTime: "desc" },
  });
  res.json({ trip });
});

tripsRouter.post("/:tripId/end", async (req, res) => {
  const staff = req.staff!;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, organizationId: staff.organizationId },
    select: { id: true, vanId: true, endTime: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (!(await canUseVan(staff.userId, staff.role, staff.organizationId, trip.vanId))) return res.status(403).json({ error: "Van access denied" });

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: { endTime: new Date() },
    select: { id: true, endTime: true },
  });

  res.json({ trip: updated });
});

tripsRouter.get("/:tripId/summary", async (req, res) => {
  const staff = req.staff!;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, organizationId: staff.organizationId },
    select: { id: true, vanId: true, routeName: true, startTime: true, endTime: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const distanceMeters = await getTripDistanceMeters(trip.id);
  const eventsCount = await prisma.childEvent.count({
    where: { organizationId: staff.organizationId, tripId: trip.id },
  });

  res.json({
    trip,
    summary: {
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      childEventsCount: eventsCount,
    },
  });
});

tripsRouter.get("/:tripId/details", async (req, res) => {
  const staff = req.staff!;
  const tripId = req.params.tripId;
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, organizationId: staff.organizationId },
    select: {
      id: true, vanId: true, routeName: true, startTime: true, endTime: true,
      van: { select: { name: true, plateNumber: true, routeName: true } },
      telemetryPoints: { select: { id: true, lat: true, lon: true, timestamp: true }, orderBy: { timestamp: "asc" } },
      childEvents: { select: { id: true, eventType: true, occurredAt: true, notes: true, child: { select: { id: true, firstName: true, lastName: true, className: true, residenceRoute: true, photoData: true } } }, orderBy: { occurredAt: "asc" } },
    },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (!(await canUseVan(staff.userId, staff.role, staff.organizationId, trip.vanId))) return res.status(403).json({ error: "Van access denied" });
  const distanceMeters = await getTripDistanceMeters(trip.id);
  res.json({ trip: { ...trip, summary: { distanceMeters, distanceKm: Number((distanceMeters / 1000).toFixed(2)), childEventsCount: trip.childEvents.length } } });
});
