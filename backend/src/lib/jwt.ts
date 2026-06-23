import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtStaffPayload = {
  sub: string; // userId
  organizationId: string;
  role: "ADMIN" | "STAFF" | "DRIVER";
};

export function signStaffJwt(payload: JwtStaffPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyStaffJwt(token: string): JwtStaffPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded) throw new Error("Invalid JWT");
  return decoded as JwtStaffPayload;
}
