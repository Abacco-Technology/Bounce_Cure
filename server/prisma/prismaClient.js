// server/prisma/prismaClient.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=5&pool_timeout=30",
    },
  },
  log: ["error"],
});

export { prisma };