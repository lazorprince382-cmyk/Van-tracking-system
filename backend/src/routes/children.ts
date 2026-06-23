import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { staffAuth } from "../middleware/staffAuth";

export const childrenRouter = Router();

childrenRouter.use("/children", staffAuth());

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  notes: z.string().max(500).optional(),
  className: z.string().min(1).max(50),
  parentPhone: z.string().min(5).max(30),
  residenceRoute: z.string().min(1).max(150),
  photoData: z.string().max(3000000).optional(),
  assignments: z.array(z.object({
    period: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
    vanId: z.string().min(1),
  })).max(3).default([]),
});

const updateSchema = createSchema.omit({ assignments: true }).extend({
  assignments: z.array(z.object({
    period: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
    vanId: z.string().min(1),
  })).max(3),
});

childrenRouter.post("/children", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can register children" });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  if (parsed.data.assignments.filter((a) => a.period !== "MORNING").length > 1) {
    return res.status(400).json({ error: "Choose only one journey home: after lunch or evening" });
  }
  const staff = req.staff!;

  const child = await prisma.child.create({
    data: {
      organizationId: staff.organizationId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      notes: parsed.data.notes,
      className: parsed.data.className,
      parentPhone: parsed.data.parentPhone,
      residenceRoute: parsed.data.residenceRoute,
      photoData: parsed.data.photoData,
      assignments: { create: parsed.data.assignments.map((assignment) => ({ ...assignment })) },
    },
    select: { id: true, firstName: true, lastName: true, notes: true, createdAt: true },
  });

  res.status(201).json({ child });
});

childrenRouter.get("/children", async (req, res) => {
  const driver = req.staff!.role === "DRIVER" ? await prisma.user.findUnique({ where: { id: req.staff!.userId }, select: { assignedVanId: true } }) : null;
  const children = await prisma.child.findMany({
    where: { organizationId: req.staff!.organizationId, ...(req.staff!.role === "DRIVER" ? { assignments: { some: { vanId: driver?.assignedVanId || "__no_assigned_van__" } } } : {}) },
    select: {
      id: true, firstName: true, lastName: true, className: true, parentPhone: true,
      residenceRoute: true, photoData: true, notes: true, createdAt: true,
      assignments: { select: { id: true, period: true, vanId: true, van: { select: { name: true } } } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
  res.json({ children });
});

childrenRouter.patch("/children/:childId", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can edit children" });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the child details" });
  if (parsed.data.assignments.filter((a) => a.period !== "MORNING").length > 1) {
    return res.status(400).json({ error: "Choose only one journey home: after lunch or evening" });
  }
  const existing = await prisma.child.findFirst({
    where: { id: req.params.childId, organizationId: req.staff!.organizationId },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: "Child not found" });
  const { assignments, ...details } = parsed.data;
  const child = await prisma.$transaction(async (tx) => {
    await tx.transportAssignment.deleteMany({ where: { childId: existing.id } });
    return tx.child.update({
      where: { id: existing.id },
      data: { ...details, assignments: { create: assignments } },
      select: { id: true },
    });
  });
  res.json({ child });
});

childrenRouter.delete("/children/:childId", async (req, res) => {
  if (req.staff!.role !== "ADMIN") return res.status(403).json({ error: "Only administrators can delete children" });
  const result = await prisma.child.deleteMany({
    where: { id: req.params.childId, organizationId: req.staff!.organizationId },
  });
  if (!result.count) return res.status(404).json({ error: "Child not found" });
  res.status(204).send();
});
