import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { deviceAuth } from "../middleware/deviceAuth";
import { broadcastVanPosition } from "../realtime/wsServer";

export const telemetryRouter = Router();

telemetryRouter.post("/telemetry", deviceAuth(), async (req, res) => {
  const payloadSchema = z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
    timestamp: z.coerce.date().optional(),
  });

  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid telemetry payload" });

  const { lat, lon, speed, heading, timestamp } = parsed.data;
  const ts = timestamp ?? new Date();

  // Associate to the currently active trip (if any) for this van.
  const activeTrip = await prisma.trip.findFirst({
    where: {
      organizationId: req.device!.organizationId,
      vanId: req.device!.vanId,
      startTime: { lte: ts },
      OR: [{ endTime: null }, { endTime: { gte: ts } }],
    },
    select: { id: true },
  });

  const point = await prisma.telemetryPoint.create({
    data: {
      organizationId: req.device!.organizationId,
      vanId: req.device!.vanId,
      tripId: activeTrip?.id ?? null,
      timestamp: ts,
      lat,
      lon,
      speed,
      heading,
    },
    select: { id: true },
  });

  await prisma.vanLivePosition.upsert({
    where: { vanId: req.device!.vanId },
    create: {
      organizationId: req.device!.organizationId,
      vanId: req.device!.vanId,
      lat,
      lon,
      timestamp: ts,
    },
    update: {
      lat,
      lon,
      timestamp: ts,
      updatedAt: new Date(),
    },
  });

  broadcastVanPosition({
    type: "van_position",
    vanId: req.device!.vanId,
    lat,
    lon,
    timestamp: ts.toISOString(),
  });

  // Basic success response; clients already have coordinates from payload.
  res.json({ ok: true, id: point.id });
});

