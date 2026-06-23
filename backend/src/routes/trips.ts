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

tripsRouter.post("/", async (req, res) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const staff = req.staff!;
  const { vanId, routeName, startTime } = parsed.data;

  const van = await prisma.van.findFirst({
    where: { id: vanId, organizationId: staff.organizationId },
    select: { id: true },
  });
  if (!van) return res.status(404).json({ error: "Van not found" });

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
  const trips = await prisma.trip.findMany({
    where: { organizationId: staff.organizationId },
    select: { id: true, vanId: true, routeName: true, startTime: true, endTime: true },
    orderBy: { startTime: "desc" },
  });
  res.json({ trips });
});

tripsRouter.post("/:tripId/end", async (req, res) => {
  const staff = req.staff!;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, organizationId: staff.organizationId },
    select: { id: true, endTime: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

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

