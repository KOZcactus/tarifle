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

import { getNewsletterContent } from "../src/lib/queries/newsletter";
import { sendWeeklyNewsletter } from "../src/lib/email/newsletter-weekly";

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

  // Globals'ı template fonksiyonuna verebilmek için module-level prisma'yi
  // setlemeye gerek yok; getNewsletterContent default prisma client'i import
  // ediyor (src/lib/prisma.ts), o da DATABASE_URL'i okur.

  const content = await getNewsletterContent();
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
