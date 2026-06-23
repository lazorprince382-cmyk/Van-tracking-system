import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";

export const camerasRouter = Router();
camerasRouter.use(staffAuth());

camerasRouter.get("/cameras", async (req, res) => {
  const staff = req.staff!;
  const driver = staff.role === "DRIVER" ? await prisma.user.findUnique({ where: { id: staff.userId }, select: { assignedVanId: true } }) : null;
  const requestedVan = typeof req.query.vanId === "string" ? req.query.vanId : undefined;
  const vanId = staff.role === "DRIVER" ? driver?.assignedVanId || "__no_assigned_van__" : requestedVan;
  const cameras = await prisma.vanCamera.findMany({ where: { ...(vanId ? { vanId } : {}), van: { organizationId: staff.organizationId }, enabled: true }, select: { id: true, vanId: true, name: true, position: true, streamType: true, streamUrl: true, enabled: true, createdAt: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  res.json({ cameras });
});

const cameraSchema = z.object({ vanId: z.string().min(1), name: z.string().min(1).max(80), position: z.enum(["INSIDE", "OUTSIDE", "FRONT", "REAR"]), streamType: z.enum(["HLS", "MJPEG", "WEBPAGE"]), streamUrl: z.string().url().max(1000) });
camerasRouter.post("/cameras", staffAuth(["ADMIN"]), async (req, res) => {
  const parsed = cameraSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Check the camera name, position, stream type and URL" });
  const van = await prisma.van.findFirst({ where: { id: parsed.data.vanId, organizationId: req.staff!.organizationId }, select: { id: true } });
  if (!van) return res.status(404).json({ error: "Van not found" });
  const camera = await prisma.vanCamera.create({ data: parsed.data, select: { id: true, name: true } });
  res.status(201).json({ camera });
});

camerasRouter.delete("/cameras/:cameraId", staffAuth(["ADMIN"]), async (req, res) => {
  const result = await prisma.vanCamera.deleteMany({ where: { id: String(req.params.cameraId), van: { organizationId: req.staff!.organizationId } } });
  if (!result.count) return res.status(404).json({ error: "Camera not found" });
  res.status(204).send();
});
