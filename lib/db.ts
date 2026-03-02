import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// В serverless среде (Vercel) не нужен ws — Neon использует fetch/WebSocket браузера
// ws нужен только для Node.js (dev, seed, migrate)
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require("ws");
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // PrismaNeon в v6.19+ принимает PoolConfig (не экземпляр Pool)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy singleton — PrismaClient создаётся только при первом обращении к prisma,
// чтобы не падать при билде, когда DATABASE_URL не задан.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const client = globalForPrisma.prisma;
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
