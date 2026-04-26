/**
 * Mod I sonrası canonical rename adaylarını tespit et.
 *
 * Mantık: Mod I'da bir cluster'da canonical coğrafi prefix tasiyor +
 * silinen duplicate slug global (prefix'siz) ise → canonical rename
 * adayı. Eski duplicate global slug'ı canonical'a yeniden ata.
 *
 * Cografi prefix listesi: 50+ sehir/bolge ad?.
 *
 * Cikti: docs/canonical-rename-candidates.md (markdown rapor) +
 *        scripts/canonical-rename-list.json (apply scripti icin).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

const GEO_PREFIXES = [
  // it
  "naples", "napoli", "rome", "roma", "milan", "milano", "florence", "florensa", "floransa",
  "venice", "venedik", "sicily", "sicilya", "tuscany", "toskana",
  // fr
  "paris", "marseille", "marsilya", "lyon", "nice", "provence", "burgonya",
  // es
  "madrid", "barcelona", "barselona", "seville", "sevilla", "valencia", "valensiya", "andaluz",
  // de
  "berlin", "munich", "munih", "hamburg", "frankfurt",
  // gr
  "athens", "atina", "thessaloniki", "selanik",
  // hu
  "budapest", "budapeste",
  // id
  "jakarta", "cakarta", "bali", "surabaya",
  // in
  "delhi", "mumbai", "punjab", "kolkata", "bangalore", "kerala",
  // it (extra)
  "bologna",
  // jp
  "tokyo", "kyoto", "osaka", "kobe",
  // kr
  "seoul", "seul", "busan", "incheon",
  // ma
  "casablanca", "kazablanka", "marrakesh", "marakes",
  // me
  "cairo", "kahire", "beirut", "beyrut", "istanbul",
  // mx
  "mexico", "meksiko", "meksika", "oaxaca", "puebla", "guadalajara",
  // ng
  "lagos",
  // pe
  "lima", "cuzco", "arequipa",
  // pk
  "lahore", "lahor", "karachi", "islamabad",
  // pl
  "warsaw", "varsova", "krakow", "krakov", "gdansk",
  // ru
  "moscow", "moskova", "stockholm", "saint-petersburg",
  // se
  // cu
  "havana", "santiago",
  // br
  "rio", "sao-paulo", "salvador", "fortaleza",
  // cn
  "beijing", "pekin", "shanghai", "sanghay", "sichuan", "canton", "guangzhou",
  // th
  "bangkok", "chiang-mai", "phuket",
  // et
  "addis-ababa",
  // us
  "new-york", "new-orleans", "boston", "chicago", "miami", "san-francisco", "los-angeles",
  // vn
  "hanoi", "ho-chi-minh", "saigon",
  // au
  "sydney", "sidney", "melbourne", "brisbane",
  // tr
  "ankara", "istanbul", "izmir", "antalya", "trabzon", "rize", "gaziantep",
  "konya", "kayseri", "diyarbakir", "mardin", "edirne", "bursa", "siirt",
  "manisa", "sanliurfa", "mugla", "hatay", "van", "yozgat", "anadolu",
  "corum", "eskisehir", "beypazari", "sakarya",
];

interface Cluster {
  cuisine: string;
  type: string;
  canonicalSlug: string;
  canonicalTitle: string;
  duplicateSlugs: string[];
  duplicateTitles: string[];
  confidence: string;
  reason: string;
}

interface RenameCandidate {
  currentSlug: string;
  currentTitle: string;
  proposedSlug: string;
  proposedTitle: string;
  cuisine: string;
  type: string;
  reason: string;
}

function hasGeoPrefix(slug: string): { hit: boolean; prefix: string } {
  for (const p of GEO_PREFIXES) {
    if (slug.startsWith(p + "-")) return { hit: true, prefix: p };
  }
  return { hit: false, prefix: "" };
}

function stripGeoPrefix(slug: string, prefix: string): string {
  if (slug.startsWith(prefix + "-")) {
    return slug.slice(prefix.length + 1);
  }
  return slug;
}

function stripPrefixFromTitle(title: string, prefixSlug: string): string {
  // Approximate, capitalize-aware. "Naples Pizza Margherita" -> "Pizza Margherita"
  const norm = (s: string) =>
    s
      .toLocaleLowerCase("tr")
      .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c] ?? c);
  const titleNorm = norm(title);
  const idx = titleNorm.indexOf(prefixSlug);
  if (idx === 0 && title.length > prefixSlug.length) {
    return title.slice(prefixSlug.length).trimStart();
  }
  // try first word match
  const firstWord = title.split(/\s+/)[0]?.toLocaleLowerCase("tr") ?? "";
  if (norm(firstWord) === prefixSlug) {
    return title.slice(firstWord.length).trimStart();
  }
  return title;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  console.log(`DB: ${new URL(databaseUrl).host}`);

  const candidates: RenameCandidate[] = [];

  for (let b = 1; b <= 5; b++) {
    const jsonPath = path.resolve(process.cwd(), `docs/mod-i-batch-${b}.json`);
    if (!fs.existsSync(jsonPath)) continue;
    const clusters: Cluster[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    for (const c of clusters) {
      const { hit, prefix } = hasGeoPrefix(c.canonicalSlug);
      if (!hit) continue;
      const stripped = stripGeoPrefix(c.canonicalSlug, prefix);
      // Eger duplicate'lerden biri stripped ile esit ise, demek ki global silinmis,
      // canonical rename adayi.
      const matchedDup = c.duplicateSlugs.find((d) => d === stripped);
      if (!matchedDup) continue;
      // Eger stripped slug DB'de hala varsa, rename catismaya neden olur, atla.
      const existing = await prisma.recipe.findUnique({
        where: { slug: stripped },
        select: { id: true },
      });
      if (existing) continue;
      const canonicalRow = await prisma.recipe.findUnique({
        where: { slug: c.canonicalSlug },
        select: { id: true, slug: true, title: true },
      });
      if (!canonicalRow) continue;
      const newTitle = stripPrefixFromTitle(canonicalRow.title, prefix);
      candidates.push({
        currentSlug: canonicalRow.slug,
        currentTitle: canonicalRow.title,
        proposedSlug: stripped,
        proposedTitle: newTitle,
        cuisine: c.cuisine,
        type: c.type,
        reason: `Mod I dup '${matchedDup}' silindi, prefix '${prefix}' kaldirilabilir`,
      });
    }
  }

  // Deduplicate (ayni currentSlug birden fazla cluster'da gelebilir)
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.currentSlug)) return false;
    seen.add(c.currentSlug);
    return true;
  });

  // MD output
  const lines: string[] = [];
  lines.push(`# Canonical rename adaylari`);
  lines.push("");
  lines.push(`Toplam: ${unique.length}`);
  lines.push("");
  lines.push("| Mevcut slug | Onerilen slug | Mevcut title | Onerilen title | Cuisine/Type |");
  lines.push("|---|---|---|---|---|");
  for (const u of unique) {
    lines.push(
      `| \`${u.currentSlug}\` | \`${u.proposedSlug}\` | "${u.currentTitle}" | "${u.proposedTitle}" | ${u.cuisine}/${u.type} |`,
    );
  }
  lines.push("");
  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/canonical-rename-candidates.md"),
    lines.join("\n"),
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), "scripts/canonical-rename-list.json"),
    JSON.stringify(unique, null, 2),
  );

  console.log(`Toplam aday: ${unique.length}`);
  console.log(`Yazildi: docs/canonical-rename-candidates.md + scripts/canonical-rename-list.json`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
