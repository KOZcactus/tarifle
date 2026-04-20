/**
 * Remove incorrect 'vejetaryen' tag from medianoche-sandwich (Kuba
 * sandviçi, pork + Swiss cheese içeriyor, veg değil). Codex backfill-08
 * issues listesinde flag'lendi.
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

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-medianoche-tag");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const r = await prisma.recipe.findUnique({
      where: { slug: "medianoche-sandwich" },
      select: {
        id: true,
        tags: { select: { tag: { select: { slug: true, id: true } } } },
      },
    });
    if (!r) {
      console.log("not found");
      return;
    }
    const tags = r.tags.map((t) => t.tag.slug);
    console.log("  current tags:", tags);
    const vejTag = r.tags.find((t) => t.tag.slug === "vejetaryen");
    if (!vejTag) {
      console.log("  no vejetaryen tag, already clean");
      return;
    }
    if (apply) {
      await prisma.recipeTag.delete({
        where: {
          recipeId_tagId: { recipeId: r.id, tagId: vejTag.tag.id },
        },
      });
      console.log("  ✅ removed vejetaryen tag");
    } else {
      console.log("  • would remove vejetaryen (dry-run)");
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
