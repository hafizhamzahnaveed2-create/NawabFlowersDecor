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
// or enum values (e.g. ProductType.SERVICE). Otherwise queries fail with
// "Value 'X' not found in enum".
// Bump PRISMA_CLIENT_REV whenever schema enums/models change after generate.
const PRISMA_CLIENT_REV = 3;
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientRev?: number;
};

function getClient() {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.prismaClientRev === PRISMA_CLIENT_REV &&
    typeof (cached as { wishlistItem?: unknown }).wishlistItem !== "undefined" &&
    typeof (cached as { storeEvent?: unknown }).storeEvent !== "undefined" &&
    typeof (cached as { siteSetting?: unknown }).siteSetting !== "undefined" &&
    typeof (cached as { deliveryZone?: unknown }).deliveryZone !== "undefined"
  ) {
    return cached;
  }
  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientRev = PRISMA_CLIENT_REV;
  }
  return client;
}

export const prisma = getClient();
