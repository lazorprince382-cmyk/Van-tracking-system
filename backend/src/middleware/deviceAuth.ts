import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

declare global {
  namespace Express {
    interface Request {
      device?: { vanId: string; organizationId: string };
    }
  }
}

export function deviceAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.header("x-device-key");
      if (!key) return res.status(401).json({ error: "Missing x-device-key" });

      const van = await prisma.van.findUnique({
        where: { deviceKey: key },
        select: { id: true, organizationId: true },
      });

      if (!van) return res.status(401).json({ error: "Invalid device key" });

      req.device = { vanId: van.id, organizationId: van.organizationId };
      next();
    } catch (err: any) {
      return res.status(401).json({ error: err?.message ?? "Unauthorized" });
    }
  };
}

