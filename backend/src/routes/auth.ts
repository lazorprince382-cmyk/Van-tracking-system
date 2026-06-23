import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { signStaffJwt } from "../lib/jwt";
import { staffAuth } from "../middleware/staffAuth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email/password" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email/password" });

  const token = signStaffJwt({
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role as any,
  });

  return res.json({ token });
});

authRouter.get("/me", staffAuth(), async (req, res) => {
  const staff = req.staff!;
  const user = await prisma.user.findUnique({
    where: { id: staff.userId },
    select: { id: true, email: true, role: true, fullName: true, phone: true, assignedVanId: true, assignedVan: { select: { id: true, name: true, plateNumber: true, routeName: true } }, organizationId: true, createdAt: true },
  });

  return res.json({ user });
});

const profileSchema = z.object({ fullName: z.string().min(2).max(100), email: z.string().email(), phone: z.string().min(5).max(30) });
authRouter.patch("/me", staffAuth(), async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check your name, email and phone number" });
  const staff = req.staff!;
  const duplicate = await prisma.user.findFirst({ where: { organizationId: staff.organizationId, email: parsed.data.email, id: { not: staff.userId } }, select: { id: true } });
  if (duplicate) return res.status(409).json({ error: "Another account already uses this email" });
  const user = await prisma.user.update({ where: { id: staff.userId }, data: parsed.data, select: { id: true, fullName: true, email: true, phone: true, role: true } });
  res.json({ user });
});

const passwordSchema = z.object({ currentPassword: z.string().min(4), newPassword: z.string().min(6).max(100) });
authRouter.post("/change-password", staffAuth(), async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "The new password must contain at least 6 characters" });
  const user = await prisma.user.findUnique({ where: { id: req.staff!.userId }, select: { id: true, passwordHash: true } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) return res.status(400).json({ error: "Current password is incorrect" });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
  res.json({ ok: true });
});
