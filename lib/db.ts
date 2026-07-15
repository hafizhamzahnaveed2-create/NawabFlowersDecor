import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Neon's serverless driver needs a WebSocket implementation in Node.
neonConfig.webSocketConstructor = ws;

function createClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

// Reuse a single client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
