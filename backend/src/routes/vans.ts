import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";
import { reverseGeocodeArea } from "../services/reverseGeocode";

export const vansRouter = Router();

vansRouter.use(staffAuth());

const createVanSchema = z.object({
  name: z.string().min(1).max(80),
  plateNumber: z.string().max(30).optional(),
  photoData: z.string().max(3_000_000).optional(),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().max(30).optional(),
  capacity: z.number().int().min(1).max(100).default(14),
  routeName: z.string().max(120).optional(),
  morningDeparture: z.string().max(10).optional(),
  afternoonDeparture: z.string().max(10).optional(),
  eveningDeparture: z.string().max(10).optional(),
});

vansRouter.post("/", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can register vans" });
  const parsed = createVanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the van details" });
  const van = await prisma.van.create({
    data: {
      ...parsed.data,
      organizationId: req.staff!.organizationId,
      deviceKey: `van-${crypto.randomUUID()}`,
    },
    select: { id: true, name: true },
  });
  res.status(201).json({ van });
});

vansRouter.get("/", async (req, res) => {
  const staff = req.staff!;
  const driver = staff.role === "DRIVER" ? await prisma.user.findUnique({ where: { id: staff.userId }, select: { assignedVanId: true } }) : null;
  const vans = await prisma.van.findMany({
    where: { organizationId: staff.organizationId, ...(staff.role === "DRIVER" ? { id: driver?.assignedVanId || "__no_assigned_van__" } : {}) },
    select: {
      id: true, name: true, plateNumber: true, photoData: true, driverName: true, driverPhone: true,
      capacity: true, routeName: true, morningDeparture: true, afternoonDeparture: true,
      eveningDeparture: true, createdAt: true,
      assignments: {
        select: { period: true, child: { select: { id: true, firstName: true, lastName: true, className: true, residenceRoute: true, photoData: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ vans });
});

vansRouter.patch("/:vanId", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can edit vans" });
  const parsed = createVanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the van details" });
  const existing = await prisma.van.findFirst({ where: { id: String(req.params.vanId), organizationId: req.staff!.organizationId }, select: { id: true } });
  if (!existing) return res.status(404).json({ error: "Van not found" });
  const van = await prisma.van.update({ where: { id: existing.id }, data: parsed.data, select: { id: true, name: true } });
  res.json({ van });
});

vansRouter.delete("/:vanId", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can delete vans" });
  const result = await prisma.van.deleteMany({ where: { id: String(req.params.vanId), organizationId: req.staff!.organizationId } });
  if (!result.count) return res.status(404).json({ error: "Van not found" });
  res.status(204).send();
});

vansRouter.get("/:vanId/track", async (req, res) => {
  const staff = req.staff!;
  const vanId = req.params.vanId;

  const fromSchema = z.coerce.date().optional();
  const limitSchema = z.coerce.number().int().min(1).max(5000).optional();

  const from = req.query.from ? fromSchema.safeParse(req.query.from).data : undefined;
  const to = req.query.to ? fromSchema.safeParse(req.query.to).data : undefined;
  const limit = req.query.limit ? limitSchema.safeParse(req.query.limit).data : undefined;

  const points = await prisma.telemetryPoint.findMany({
    where: {
      organizationId: staff.organizationId,
      vanId,
      ...(from ? { timestamp: { gte: from } } : {}),
      ...(to ? { timestamp: { lte: to } } : {}),
    },
    select: { id: true, timestamp: true, lat: true, lon: true },
    orderBy: { timestamp: "desc" },
    take: limit ?? 500,
  });

  res.json({ points: points.reverse() });
});

const manualLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.coerce.date().optional(),
});

vansRouter.post("/:vanId/manual-location", async (req, res) => {
  const parsed = manualLocationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const staff = req.staff!;
  const vanId = req.params.vanId;
  if (staff.role === "DRIVER") {
    const driver = await prisma.user.findFirst({ where: { id: staff.userId, assignedVanId: String(vanId) }, select: { id: true } });
    if (!driver) return res.status(403).json({ error: "You can only update your assigned van" });
  }
  const { lat, lon, speed, heading, timestamp } = parsed.data;
  const ts = timestamp ?? new Date();

  const van = await prisma.van.findFirst({
    where: { id: vanId, organizationId: staff.organizationId },
    select: { id: true },
  });
  if (!van) return res.status(404).json({ error: "Van not found" });

  const activeTrip = await prisma.trip.findFirst({
    where: {
      organizationId: staff.organizationId,
      vanId,
      startTime: { lte: ts },
      OR: [{ endTime: null }, { endTime: { gte: ts } }],
    },
    select: { id: true },
  });

  const point = await prisma.telemetryPoint.create({
    data: {
      organizationId: staff.organizationId,
      vanId,
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
    where: { vanId },
    create: {
      organizationId: staff.organizationId,
      vanId,
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

  const area = await reverseGeocodeArea(lat, lon);

  res.json({
    ok: true,
    pointId: point.id,
    areaName: area?.areaName ?? null,
    displayName: area?.displayName ?? null,
  });
});
