/**
 * Mod B coverage hangi batch'lere ait, dökümünü çıkar.
 * "Mod A only" (title+desc var, ingredients+steps yok) olan 1119 tarifin
 * yaklaşık oluşum tarihine + slug örneklerine bakıp batch belirleme.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const recipes: Array<{ id: string; slug: string; createdAt: Date; translations: unknown }> =
    await prisma.recipe.findMany({
      select: { id: true, slug: true, createdAt: true, translations: true },
      orderBy: { createdAt: "asc" },
    });

  const bucketEdges = [
    { label: "Batch 0-3 (retrofit)", end: new Date("2026-04-15T00:00:00Z") },
    { label: "Batch 4-11", end: new Date("2026-04-18T12:00:00Z") },
    { label: "Batch 12-17 (oturum 6-7)", end: new Date("2026-04-19T18:00:00Z") },
    { label: "Batch 18-20 (oturum 8)", end: new Date("2026-04-20T00:00:00Z") },
    { label: "Batch 21-23 (oturum 9)", end: new Date("2026-04-21T00:00:00Z") },
  ];

  const summary = bucketEdges.map((b) => ({ label: b.label, end: b.end, total: 0, modBComplete: 0, modAOnly: 0, none: 0 }));

  let modAOnlyAll = 0;
  let modBCompleteAll = 0;
  const modAOnlySample: string[] = [];

  for (const r of recipes) {
    const t = r.translations as {
      en?: { title?: string; ingredients?: unknown[] };
      de?: { title?: string; ingredients?: unknown[] };
    } | null;

    const enHasTitle = !!t?.en?.title;
    const enHasIng = Array.isArray(t?.en?.ingredients) && (t?.en?.ingredients?.length ?? 0) > 0;
    const deHasTitle = !!t?.de?.title;
    const deHasIng = Array.isArray(t?.de?.ingredients) && (t?.de?.ingredients?.length ?? 0) > 0;

    let kind: "modB" | "modA" | "none";
    if (!t || (!enHasTitle && !deHasTitle)) kind = "none";
    else if (enHasTitle && enHasIng && deHasTitle && deHasIng) kind = "modB";
    else kind = "modA";

    if (kind === "modA") {
      modAOnlyAll++;
      if (modAOnlySample.length < 20) modAOnlySample.push(`  ${r.slug}  (${r.createdAt.toISOString().slice(0, 10)})`);
    } else if (kind === "modB") modBCompleteAll++;

    for (const b of summary) {
      if (r.createdAt < b.end) {
        b.total++;
        if (kind === "modB") b.modBComplete++;
        else if (kind === "modA") b.modAOnly++;
        else b.none++;
        break;
      }
    }
  }

  console.log(`Toplam: ${recipes.length} tarif\n`);
  console.log(`Tarih bucket breakdown:`);
  let prevTotal = 0;
  for (const b of summary) {
    const bucketSize = b.total - prevTotal;
    prevTotal = b.total;
    console.log(`  ${b.label.padEnd(30)} (< ${b.end.toISOString().slice(0, 10)})`);
    console.log(`     cumul=${b.total}, incremental=${bucketSize}, modB=${b.modBComplete}, modA-only=${b.modAOnly}, none=${b.none}`);
  }

  console.log(`\nToplam Mod B complete: ${modBCompleteAll}`);
  console.log(`Toplam Mod A only:     ${modAOnlyAll}`);

  console.log(`\nİlk 20 "Mod A only" tarif slug + tarih (eski batch'leri gösterir):`);
  for (const s of modAOnlySample) console.log(s);

  // İçinde detaylı olarak bir örnekteki translations yapısını bas, şüpheyi kapatsın
  if (modAOnlySample.length > 0) {
    const sampleSlug = modAOnlySample[0].trim().split(/\s+/)[0];
    const sample = await prisma.recipe.findUnique({
      where: { slug: sampleSlug },
      select: { slug: true, title: true, createdAt: true, translations: true },
    });
    console.log(`\n📋 Örnek Mod A only tarif translations yapısı:`);
    console.log(`  slug: ${sample?.slug}`);
    console.log(`  title: ${sample?.title}`);
    console.log(`  createdAt: ${sample?.createdAt.toISOString()}`);
    console.log(`  translations keys:`, Object.keys((sample?.translations as object) ?? {}));
    const t = sample?.translations as {
      en?: Record<string, unknown>;
      de?: Record<string, unknown>;
    } | null;
    if (t?.en) console.log(`  en keys:`, Object.keys(t.en));
    if (t?.de) console.log(`  de keys:`, Object.keys(t.de));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
