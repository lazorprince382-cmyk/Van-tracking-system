import { PrismaClient } from "@prisma/client";

// PrismaClient is safe to reuse across requests.
export const prisma = new PrismaClient();

