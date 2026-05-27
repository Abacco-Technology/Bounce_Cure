// server/prisma/prismaClient.js

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// ✅ Create single Prisma instance
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

// ✅ Prevent multiple Prisma instances during hot reload (dev mode)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}