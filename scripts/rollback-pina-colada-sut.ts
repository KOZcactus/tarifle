/**
 * One-shot rollback: empty-allergen audit yanlışlıkla pina-colada'ya SUT
 * ekledi (ingredient "Hindistan cevizi kreması" audit filter'ında
 * "coconut" yerine "krema" match'i verdi). Brief §5'e göre coconut
 * cream dairy değil, SUT eklenmemeliydi. Geri alıyoruz.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main(): Promise<void> {
  assertDbTarget("rollback-pina-colada-sut");
  const r = await prisma.recipe.findUnique({
    where: { slug: "pina-colada" },
    select: { id: true, allergens: true, title: true },
  });
  if (!r) {
    console.log("pina-colada bulunamadı");
    return;
  }
  console.log(`Before: ${r.title} allergens = [${r.allergens.join(", ")}]`);
  const next = r.allergens.filter((a) => a !== "SUT");
  await prisma.recipe.update({ where: { id: r.id }, data: { allergens: next } });
  console.log(`After: allergens = [${next.join(", ")}]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
