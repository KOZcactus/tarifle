/**
 * Mod M Batch 1-3 revert: Codex teslim kalitesi yetersiz oldugu icin
 * (52/57 entry'de Türkçe karakter eksik + cogu redundancy ile tipNote
 * tekrari) tum MARINE_APPLY kayitlari geri alinir. Codex'ten yeniden
 * istenecek (brief §19 yeni Kural 7+8 ile).
 *
 * Her MARINE_APPLY AuditLog kaydi icin:
 *   1. recipe.totalMinutes = oldTotalMinutes geri set
 *   2. tipNote'tan eklenmis tipNote_addition'i (sondaki " " + addition)
 *      cikar; idempotent: zaten yoksa dokunmaz
 *   3. AuditLog action="MARINE_REVERT" yeni kayit ekle (orijinal apply'in
 *      audit_id'si metadata'da)
 *
 * Idempotent: ayni recipe icin daha once REVERT edilmisse skip
 * (orijinal MARINE_APPLY'in oldTotalMinutes'i ile mevcut totalMinutes
 * eslesirse zaten revert edilmis demektir).
 *
 * Usage:
 *   npx tsx scripts/revert-mod-m-batch.ts                       # dry-run
 *   npx tsx scripts/revert-mod-m-batch.ts --apply               # dev
 *   npx tsx scripts/revert-mod-m-batch.ts --env prod --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

interface MarineApplyMetadata {
  slug: string;
  oldTotalMinutes: number;
  newTotalMinutes: number;
  marineMinutes: number;
  tipNote_addition: string | null;
  sources?: string[];
  confidence?: string;
  reason?: string;
}

async function main() {
  assertDbTarget("revert-mod-m-batch");
  const APPLY = process.argv.includes("--apply");

  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);

  // En eski MARINE_APPLY kayitlarini al (asc), idempotent: ayni recipe
  // icin birden cok varsa ilkini esas alir.
  const audits = await prisma.auditLog.findMany({
    where: { action: "MARINE_APPLY" },
    orderBy: { createdAt: "asc" },
  });
  console.log(`MARINE_APPLY toplam: ${audits.length}`);
  console.log("");

  // Recipe ID'lerini grupla, ayni recipe icin sadece ilk apply'i revert
  const seen = new Set<string>();
  const reverts: typeof audits = [];
  for (const a of audits) {
    if (!a.targetId) continue;
    if (seen.has(a.targetId)) continue;
    seen.add(a.targetId);
    reverts.push(a);
  }
  console.log(`Unique recipe revert: ${reverts.length}`);
  console.log("");

  let reverted = 0;
  let alreadyReverted = 0;
  let notFound = 0;

  for (const a of reverts) {
    const m = a.metadata as unknown as MarineApplyMetadata;
    if (!a.targetId) continue;
    const recipe = await prisma.recipe.findUnique({
      where: { id: a.targetId },
      select: { id: true, slug: true, totalMinutes: true, tipNote: true },
    });
    if (!recipe) {
      console.log(`NOT_FOUND ${m.slug} (recipe deleted)`);
      notFound++;
      continue;
    }

    // Idempotent check: eger totalMinutes zaten oldTotalMinutes ise
    // muhtemelen revert edilmis (veya hic uygulanmamis)
    if (recipe.totalMinutes === m.oldTotalMinutes) {
      console.log(`SKIP ${m.slug} (zaten revert, totalMinutes=${m.oldTotalMinutes})`);
      alreadyReverted++;
      continue;
    }

    // tipNote'tan eklenen addition'i cikart (sondaki " " + addition)
    let revertedTipNote: string | null = recipe.tipNote;
    const add = m.tipNote_addition?.trim() ?? "";
    if (add && recipe.tipNote) {
      const sep = " " + add;
      if (recipe.tipNote.endsWith(sep)) {
        revertedTipNote = recipe.tipNote.slice(0, -sep.length).trim();
      } else if (recipe.tipNote.endsWith(add)) {
        revertedTipNote = recipe.tipNote.slice(0, -add.length).trim();
      }
      // Eger eslesmezse (manual edit olmus olabilir) tipNote'a dokunma
    }

    if (!APPLY) {
      console.log(
        `DRY ${m.slug} | total ${recipe.totalMinutes} -> ${m.oldTotalMinutes} | tipNote ${revertedTipNote === recipe.tipNote ? "unchanged" : "trimmed"}`,
      );
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          totalMinutes: m.oldTotalMinutes,
          tipNote: revertedTipNote,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "MARINE_REVERT",
          targetType: "recipe",
          targetId: recipe.id,
          metadata: {
            slug: m.slug,
            originalAuditId: a.id,
            revertedFromTotal: recipe.totalMinutes,
            revertedToTotal: m.oldTotalMinutes,
            removedTipNoteAddition: m.tipNote_addition ?? null,
            reason:
              "Mod M Batch 1-3 quality issue: Türkçe karakter eksik (52/57 entry ASCII fold) + cogu redundancy ile tipNote tekrari. Brief §19.3 Kural 7 + 8 sonrasi Codex'ten yeniden istenecek.",
          },
        },
      });
    });
    reverted++;
    console.log(`OK ${m.slug} (total ${recipe.totalMinutes} -> ${m.oldTotalMinutes})`);
  }

  console.log("");
  console.log(`Summary: ${reverted} reverted, ${alreadyReverted} already-reverted, ${notFound} not_found`);
  if (!APPLY) console.log(`Dry-run. --apply ile DB'ye yaz.`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
