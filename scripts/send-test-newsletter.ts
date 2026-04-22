/**
 * Newsletter test gonderim scripti. Tek bir email adresine "haftalik
 * editor secimi" mailini gonderir; production list'e dokunmaz.
 *
 * Resend API key zaten env'de. Subscriber DB satiri uydurma (ephemeral
 * unsubscribeToken), gercek subscriber tablosuna yazma yok.
 *
 * Usage:
 *   # Default: ENV TEST_NEWSLETTER_EMAIL veya komut argumani
 *   npx tsx scripts/send-test-newsletter.ts kerem@example.com
 *
 *   # En default ile (ENV TEST_NEWSLETTER_EMAIL)
 *   TEST_NEWSLETTER_EMAIL=kerem@example.com npx tsx scripts/send-test-newsletter.ts
 *
 *   # Locale override (default tr, en)
 *   npx tsx scripts/send-test-newsletter.ts kerem@example.com en
 *
 * Cikti: 1 mail gonderilir, sonuc + duration loglanir. RESEND_API_KEY
 * eksik veya invalid ise 503 patlat.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import crypto from "node:crypto";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { sendWeeklyNewsletter } from "../src/lib/email/newsletter-weekly";
import { CUISINE_LABEL, CUISINE_FLAG } from "../src/lib/cuisines";

/**
 * Standalone script context'inde unstable_cache çalışmaz (Next runtime
 * gerek). getNewsletterContent / getFeaturedRecipes / getCuisineStats
 * hepsi cache wrapper. Bu script icin cache bypass eden inline
 * content fetcher yazariz; gercek prod cron yine cache'li helper'lari
 * kullanir.
 */
async function fetchInlineNewsletterContent(prisma: PrismaClient) {
  const [featured, recent, cuisineRows] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      select: {
        id: true, title: true, slug: true, emoji: true, difficulty: true,
        totalMinutes: true, servingCount: true, averageCalories: true,
        hungerBar: true, imageUrl: true, isFeatured: true, cuisine: true,
        category: { select: { name: true, slug: true, emoji: true } },
        _count: { select: { variations: { where: { status: "PUBLISHED" } } } },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true, title: true, slug: true, emoji: true, difficulty: true,
        totalMinutes: true, servingCount: true, averageCalories: true,
        hungerBar: true, imageUrl: true, isFeatured: true, cuisine: true,
        category: { select: { name: true, slug: true, emoji: true } },
        _count: { select: { variations: { where: { status: "PUBLISHED" } } } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.groupBy({
      by: ["cuisine"],
      where: { status: "PUBLISHED", cuisine: { not: null } },
      _count: true,
      orderBy: { _count: { cuisine: "desc" } },
    }),
  ]);

  const topCuisines = cuisineRows
    .filter((r) => r.cuisine && r._count >= 3)
    .slice(0, 4)
    .map((r) => ({
      code: r.cuisine!,
      label: (CUISINE_LABEL as Record<string, string>)[r.cuisine!] ?? r.cuisine!,
      flag: (CUISINE_FLAG as Record<string, string>)[r.cuisine!] ?? "🌍",
      count: r._count,
    }));

  // sendWeeklyNewsletter expects RecipeCard shape; cast safe (selects match).
  return {
    featured: featured as unknown as ReturnType<typeof Array<unknown>>,
    recent: recent as unknown as ReturnType<typeof Array<unknown>>,
    topCuisines,
  } as Parameters<typeof sendWeeklyNewsletter>[1];
}

async function main() {
  const email = process.argv[2] ?? process.env.TEST_NEWSLETTER_EMAIL;
  const locale = process.argv[3] ?? "tr";

  if (!email) {
    console.error(
      "HATA: email yok. Kullanim: npx tsx scripts/send-test-newsletter.ts <email> [locale]",
    );
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("HATA: RESEND_API_KEY env yok.");
    process.exit(1);
  }

  console.log(`📧 Test mail hazirlaniyor: ${email} (locale: ${locale})`);

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  // Inline content fetcher (unstable_cache bypass), gercek prod cron
  // sirasinda cache'li getNewsletterContent kullanir.
  const content = await fetchInlineNewsletterContent(prisma);
  console.log(
    `📄 Icerik: ${content.featured.length} featured + ${content.recent.length} recent + ${content.topCuisines.length} cuisine`,
  );

  // Ephemeral subscriber objesi, DB'ye yazmadan template render
  const subscriber = {
    id: "test-" + crypto.randomBytes(6).toString("hex"),
    email,
    locale,
    unsubscribeToken: "test-token-no-effect",
  };

  const startedAt = Date.now();
  const result = await sendWeeklyNewsletter(subscriber, content);
  const durationMs = Date.now() - startedAt;

  if (result.success) {
    console.log(`✅ Mail gonderildi (${durationMs}ms): ${email}`);
  } else {
    console.error(`❌ Gonderim hata: ${result.error ?? "unknown"}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
