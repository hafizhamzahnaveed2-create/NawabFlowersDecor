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

// Reuse a single client across hot reloads in development — but drop a
// stale singleton if it was created before prisma generate added models
// (e.g. wishlistItem / storeEvent). Otherwise those delegates stay undefined.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient() {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    typeof (cached as { wishlistItem?: unknown }).wishlistItem !== "undefined" &&
    typeof (cached as { storeEvent?: unknown }).storeEvent !== "undefined"
  ) {
    return cached;
  }
  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getClient();
