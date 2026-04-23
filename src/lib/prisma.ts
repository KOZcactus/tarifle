import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Runtime DB URL seçimi. Oturum 15 Neon Vercel Marketplace taşımasında
 * integration `DATABASE_URL`'i Production/Preview/Development üçüne birden
 * zorla inject etti ve manuel override'a izin vermedi. Bu nedenle Preview ve
 * Development için ayrı `DATABASE_URL_DEV` env var tanımlıyor, runtime'da
 * `VERCEL_ENV`'e göre seçim yapıyoruz:
 *   - production runtime → DATABASE_URL (ep-icy-mountain, main)
 *   - preview / development runtime → DATABASE_URL_DEV varsa onu, yoksa
 *     DATABASE_URL (ep-jolly-haze, dev)
 * Lokal `npm run dev`'de VERCEL_ENV undefined, .env.local'daki DATABASE_URL
 * zaten dev'e işaret ettiği için fallback doğru yere düşer.
 */
function resolveDatabaseUrl(): string {
  const env = process.env.VERCEL_ENV;
  if (env === "preview" || env === "development") {
    return process.env.DATABASE_URL_DEV ?? process.env.DATABASE_URL!;
  }
  return process.env.DATABASE_URL!;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: resolveDatabaseUrl() });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
