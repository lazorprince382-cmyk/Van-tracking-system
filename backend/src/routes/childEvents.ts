import { Router } from "express";
import { z } from "zod";
import { staffAuth } from "../middleware/staffAuth";
import { prisma } from "../prisma";
import { findNearestStopPlace } from "../services/stopMatcher";
import { env } from "../config/env";

export const childEventsRouter = Router();

childEventsRouter.use("/trips", staffAuth());

const eventSchema = z.object({
  childId: z.string().min(1),
  eventType: z.enum(["PICKUP", "DROP_OFF"]),
  occurredAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
  forceStopPlaceId: z.string().optional(),
});

childEventsRouter.post("/trips/:tripId/child-events", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const staff = req.staff!;
  const tripId = req.params.tripId;
  const occurredAt = parsed.data.occurredAt ?? new Date();

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, organizationId: staff.organizationId },
    select: { id: true, vanId: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const child = await prisma.child.findFirst({
    where: { id: parsed.data.childId, organizationId: staff.organizationId },
    select: { id: true },
  });
  if (!child) return res.status(404).json({ error: "Child not found" });

  let stopPlaceId: string | null = parsed.data.forceStopPlaceId ?? null;
  let nearest: any = null;

  if (!stopPlaceId) {
    const live = await prisma.vanLivePosition.findUnique({
      where: { vanId: trip.vanId },
      select: { lat: true, lon: true },
    });

    if (live) {
      nearest = await findNearestStopPlace({
        organizationId: staff.organizationId,
        lat: live.lat,
        lon: live.lon,
        radiusMeters: env.PROXIMITY_RADIUS_METERS,
      });
      stopPlaceId = nearest?.id ?? null;
    }
  }

  const event = await prisma.childEvent.create({
    data: {
      organizationId: staff.organizationId,
      tripId,
      childId: child.id,
      eventType: parsed.data.eventType,
      occurredAt,
      notes: parsed.data.notes,
      stopPlaceId,
    },
    select: {
      id: true,
      childId: true,
      tripId: true,
      eventType: true,
      occurredAt: true,
      notes: true,
      stopPlaceId: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    event,
    stopMatch: nearest
      ? { matched: true, stopPlaceId: nearest.id, stopName: nearest.name, distanceMeters: nearest.distanceMeters }
      : { matched: false, message: "No nearby stop found. Create a stop at current van location." },
  });
});

childEventsRouter.get("/trips/:tripId/child-events", async (req, res) => {
  const staff = req.staff!;
  const tripId = req.params.tripId;

  const events = await prisma.childEvent.findMany({
    where: { organizationId: staff.organizationId, tripId },
    select: {
      id: true,
      eventType: true,
      occurredAt: true,
      notes: true,
      child: { select: { id: true, firstName: true, lastName: true } },
      stopPlace: { select: { id: true, name: true, lat: true, lon: true } },
    },
    orderBy: { occurredAt: "asc" },
  });

  res.json({ events });
});

