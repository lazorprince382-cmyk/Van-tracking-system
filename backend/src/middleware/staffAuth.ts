import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { verifyStaffJwt, JwtStaffPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      staff?: JwtStaffPayload & { userId: string };
    }
  }
}

export function staffAuth(requiredRoles?: Array<JwtStaffPayload["role"]>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.header("Authorization");
      if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
      const match = auth.match(/^Bearer\s+(.+)$/i);
      if (!match) return res.status(401).json({ error: "Invalid Authorization header format" });

      const token = match[1];
      const payload = verifyStaffJwt(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, organizationId: true },
      });
      if (!user) return res.status(401).json({ error: "User not found" });
      if (user.organizationId !== payload.organizationId) {
        return res.status(401).json({ error: "Invalid token organization" });
      }
      if (requiredRoles && !requiredRoles.includes(user.role as any)) {
        return res.status(403).json({ error: "Insufficient role permissions" });
      }

      req.staff = { ...payload, userId: user.id };
      next();
    } catch (err: any) {
      return res.status(401).json({ error: err?.message ?? "Unauthorized" });
    }
  };
}

