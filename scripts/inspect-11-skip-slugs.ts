/**
 * 11 SKIP slug için source vs DB ingredient drift raporu.
 * Source'ta hangi DB ingredient'ları eksik?
 */
import path from "node:path";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local") });

const SLUGS = [
  "mafis-tatlisi-balikesir-usulu",
  "turos-barack-kup-macar-usulu",
  "tahinli-soganlama-kayseri-usulu",
  "sumakli-yumurta-kapama-kilis-usulu",
  "sakizli-kavun-kasesi-cesme-usulu",
  "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu",
  "tavuklu-yesil-mercimek-pilavi-yozgat-usulu",
  "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu",
  "zeytinli-labneli-kahvalti-ekmegi-fas-usulu",
  "tavuklu-mantarli-kesme-makarna-zonguldak-usulu",
  "nar-eksili-cokelek-salatasi-hatay-usulu",
];

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  const seed = fs.readFileSync(path.resolve("scripts/seed-recipes.ts"), "utf-8");
  for (const slug of SLUGS) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: {
        slug: true,
        ingredients: { select: { name: true, amount: true, unit: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!r) { console.log(`${slug}: NOT FOUND`); continue; }
    const lines = seed.split("\n");
    const sourceLine = lines.find((l) => l.includes(`slug: "${slug}"`));
    if (!sourceLine) { console.log(`${slug}: source LINE NOT FOUND`); continue; }
    // Extract source ingredient names
    const ingMatch = sourceLine.match(/ingredients:\s*(?:ing\()?\[([\s\S]*?)\]\)?/);
    const sourceNames: string[] = [];
    if (ingMatch) {
      const block = ingMatch[1];
      // string-pipe format: "Name|amount|unit"
      for (const m of block.matchAll(/"([^"|]+)\|/g)) sourceNames.push(m[1]);
      // object format: name: "Name"
      for (const m of block.matchAll(/name:\s*"([^"]+)"/g)) sourceNames.push(m[1]);
    }
    const dbNames = r.ingredients.map((i) => i.name);
    const missingInSource = dbNames.filter((d) => !sourceNames.includes(d));
    const onlyInSource = sourceNames.filter((s) => !dbNames.includes(s));
    console.log(`\n${slug}:`);
    console.log(`  DB (${dbNames.length}): ${dbNames.join(" | ")}`);
    console.log(`  Source (${sourceNames.length}): ${sourceNames.join(" | ")}`);
    if (missingInSource.length) console.log(`  ❌ MISSING IN SOURCE: ${missingInSource.join(" | ")}`);
    if (onlyInSource.length) console.log(`  ⚠ ONLY IN SOURCE: ${onlyInSource.join(" | ")}`);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
