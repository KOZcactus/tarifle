/**
 * Generator v2 refresh: whitelist-guarded rerun.
 *
 * Generator pool'u + seed formülü değişti (salt = ingredient[0..2]).
 * Mevcut generator çıktılarını (whitelist = tüm TIP_RULES + SERV_RULES
 * variant string'leri) yeniden hesaplayıp overwrite et. Codex'in veya
 * kullanıcının yazdığı özgün cümlelere DOKUNULMAZ.
 *
 *   npx tsx scripts/refresh-tipnote-generator.ts             # dry run
 *   npx tsx scripts/refresh-tipnote-generator.ts --apply     # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/refresh-tipnote-generator.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";
import { generate, type RecipeSignal } from "./lib/tipnote-generator";

// Whitelist builder: tüm variant string'lerini al. Generator'ı reflection
// yerine direkt import edip rule dizilerini tarıyoruz.
import { readFileSync } from "node:fs";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

/** Generator dosyasından tüm variant string'lerini regex ile çek.
 *  Bu şekilde hiçbir export eklemeye gerek yok, dosya tek kaynak. */
function loadWhitelist(): Set<string> {
  const genPath = path.resolve(__d, "lib", "tipnote-generator.ts");
  const text = readFileSync(genPath, "utf-8");
  const set = new Set<string>();
  const re = /"([^"]{40,300}[^"]+)"/g; // cümle benzeri string'ler (40-300 char)
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[1];
    // Yalnızca cümle biten stringler (. veya , , ; ile biten uzun cümleler)
    if (/[.]$/.test(s) && !s.includes("://")) {
      set.add(s);
    }
  }
  return set;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("refresh-tipnote-generator");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }

  const whitelist = loadWhitelist();
  console.log(`  whitelist size: ${whitelist.size} variants (tip + serv pool)`);

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        cuisine: true,
        difficulty: true,
        prepMinutes: true,
        cookMinutes: true,
        tipNote: true,
        servingSuggestion: true,
        category: { select: { slug: true } },
        ingredients: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    let tipRefreshed = 0;
    let tipKept = 0; // özgün, whitelist dışı
    let servRefreshed = 0;
    let servKept = 0;
    let noop = 0;

    for (const r of rows) {
      const sig: RecipeSignal = {
        slug: r.slug,
        title: r.title,
        type: r.type as RecipeSignal["type"],
        categorySlug: r.category?.slug ?? "",
        cuisine: r.cuisine ?? "tr",
        difficulty: r.difficulty as RecipeSignal["difficulty"],
        prepMinutes: r.prepMinutes ?? 0,
        cookMinutes: r.cookMinutes ?? 0,
        ingredients: r.ingredients.map((i) => i.name),
      };
      const g = generate(sig);

      const tipInPool = r.tipNote && whitelist.has(r.tipNote);
      const servInPool = r.servingSuggestion && whitelist.has(r.servingSuggestion);

      const patch: { tipNote?: string; servingSuggestion?: string } = {};
      let changed = false;

      if (tipInPool) {
        if (r.tipNote !== g.tipNote) {
          patch.tipNote = g.tipNote;
          changed = true;
          tipRefreshed++;
        }
      } else if (r.tipNote) {
        tipKept++;
      }

      if (servInPool) {
        if (r.servingSuggestion !== g.servingSuggestion) {
          patch.servingSuggestion = g.servingSuggestion;
          changed = true;
          servRefreshed++;
        }
      } else if (r.servingSuggestion) {
        servKept++;
      }

      if (!changed) {
        noop++;
        continue;
      }

      if (apply) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: patch,
        });
      }
    }

    console.log(
      `\n${apply ? "applied" : "dry-run"}:\n` +
        `  tip refreshed:   ${tipRefreshed}\n` +
        `  tip kept (özgün): ${tipKept}\n` +
        `  serv refreshed:  ${servRefreshed}\n` +
        `  serv kept (özgün): ${servKept}\n` +
        `  no-op records:   ${noop}`,
    );
    if (!apply) console.log("re-run with --apply to write.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
