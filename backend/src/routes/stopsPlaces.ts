import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";

export const stopsPlacesRouter = Router();

stopsPlacesRouter.use(staffAuth());

const createStopSchema = z.object({
  name: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

stopsPlacesRouter.post("/", async (req, res) => {
  const parsed = createStopSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { name, lat, lon } = parsed.data;
  const created = await prisma.stopPlace.create({
    data: {
      organizationId: req.staff!.organizationId,
      name,
      lat,
      lon,
    },
    select: { id: true, name: true, lat: true, lon: true, createdAt: true },
  });

  res.status(201).json({ stopPlace: created });
});

stopsPlacesRouter.get("/", async (req, res) => {
  const stops = await prisma.stopPlace.findMany({
    where: { organizationId: req.staff!.organizationId },
    select: { id: true, name: true, lat: true, lon: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ stops });
});

