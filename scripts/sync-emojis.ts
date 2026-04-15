/**
 * Source'taki recipe emoji'lerini DB'ye senkronlar. seed-recipes.ts
 * idempotent INSERT (slug varsa atla) — sonradan source'a emoji eklersek
 * prod'a otomatik geçmiyor. Bu script kapatır.
 *
 * Kullanım:
 *   npx tsx scripts/sync-emojis.ts                 # apply (default)
 *   npx tsx scripts/sync-emojis.ts --dry-run       # preview
 *
 * Sadece `emoji` alanını UPDATE eder. Diğer alanlara dokunmaz, bookmark/
 * like/variation cascade'i etkilenmez. Idempotent: source ile DB aynıysa
 * UPDATE yapmaz, "no change" sayar.
 *
 * Codex batch 4'ün emoji'siz 100 tarifini düzeltmek için bu pass'te yazıldı,
 * gelecek emoji eksikliklerinde de aynı script çalıştırılabilir.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { recipes } from "./seed-recipes";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const isDryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL yok");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    console.log(
      `\n🎨 sync-emojis ${isDryRun ? "(dry-run)" : "(apply)"} → ${host}\n`,
    );

    // Source'tan slug → emoji map'ı çıkar. emoji null/undefined ise atla
    // — onlar zaten Codex source'unda da yok, sync edilecek bir şey yok.
    const sourceMap = new Map<string, string>();
    for (const r of recipes) {
      const slug = (r as { slug?: string }).slug;
      const emoji = (r as { emoji?: string | null }).emoji;
      if (slug && emoji) sourceMap.set(slug, emoji);
    }

    if (sourceMap.size === 0) {
      console.log("⚠ Source'ta emoji bulunan tarif yok. Çıkılıyor.");
      return;
    }

    // DB'deki mevcut emoji durumunu çek (sadece source'taki slug'lar için).
    const slugs = Array.from(sourceMap.keys());
    const dbRows = await prisma.recipe.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, emoji: true, title: true },
    });

    const willUpdate: { slug: string; title: string; from: string | null; to: string }[] = [];
    const noChange: string[] = [];
    const notInDb: string[] = [];

    const dbBySlug = new Map(dbRows.map((r) => [r.slug, r]));
    for (const [slug, sourceEmoji] of sourceMap) {
      const dbRow = dbBySlug.get(slug);
      if (!dbRow) {
        notInDb.push(slug);
        continue;
      }
      if (dbRow.emoji === sourceEmoji) {
        noChange.push(slug);
        continue;
      }
      willUpdate.push({
        slug,
        title: dbRow.title,
        from: dbRow.emoji,
        to: sourceEmoji,
      });
    }

    console.log(`Source'ta emoji'li tarif: ${sourceMap.size}`);
    console.log(`DB'de bulunan: ${dbRows.length}`);
    console.log(`No change: ${noChange.length}`);
    console.log(`Update edilecek: ${willUpdate.length}`);
    if (notInDb.length > 0) {
      console.log(`Source'ta var, DB'de yok: ${notInDb.length} (yeni batch henüz seed olmadı muhtemelen)`);
    }

    if (willUpdate.length === 0) {
      console.log("\n✅ Tüm emoji'ler senkron, yapacak iş yok.");
      return;
    }

    console.log("\nUpdate listesi (ilk 20):");
    for (const u of willUpdate.slice(0, 20)) {
      const fromLabel = u.from ? `"${u.from}"` : "(boş)";
      console.log(`  ${u.title.padEnd(35)}  ${fromLabel} → "${u.to}"`);
    }
    if (willUpdate.length > 20) {
      console.log(`  ... ${willUpdate.length - 20} tarif daha`);
    }

    if (isDryRun) {
      console.log(
        `\nℹ Dry-run — DB'ye dokunulmadı. Apply için --dry-run'sız çalıştır.`,
      );
      return;
    }

    // Apply: tek transaction içinde batch update.
    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const u of willUpdate) {
        await tx.recipe.update({
          where: { slug: u.slug },
          data: { emoji: u.to },
        });
        updated++;
      }
    });
    console.log(`\n✅ ${updated} tarifin emoji'si güncellendi.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
