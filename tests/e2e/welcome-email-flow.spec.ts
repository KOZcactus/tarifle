import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { closeTestDb } from "./helpers/test-user";

/**
 * Welcome email flow E2E (oturum 19 E paketi).
 *
 * registerUser action src/lib/actions/auth.ts:
 *   - User create (email + name + username + passwordHash + KVKK fields)
 *   - sendVerificationEmail fire-and-forget (provider hata atsa da signup
 *     ilerler)
 *   - **sendWelcomeEmail fire-and-forget** (oturum 19 E paketi yenisi)
 *     getEmailProvider üzerinden TR/EN locale-aware HTML + text gönderir
 *
 * Bu spec dev DB'de gerçek register flow'unu test eder. Email provider
 * RESEND_API_KEY yokken ConsoleEmailProvider'a fallback eder ve console'a
 * log basar; gerçek mail gönderilmez. Test sadece **register başarılı**
 * + **user DB'ye yazıldı** + **emailVerified NULL** (verification email
 * akışı hâlâ devam edebilir) garantisi verir.
 *
 * Welcome email içerik testi unit seviyesinde
 * (`messages/tr.json` "email.welcome" namespace) ve manuel mail-tester'a
 * gerçek SMTP akışı için bırakılmıştır.
 */

neonConfig.webSocketConstructor = ws;

let prisma: PrismaClient;
let createdUserId: string | null = null;

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const adapter = new PrismaNeon({ connectionString: url });
  prisma = new PrismaClient({ adapter });
});

test.afterAll(async () => {
  if (createdUserId) {
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
  await prisma.$disconnect();
  await closeTestDb();
});

test("register flow: user DB'ye yazılıyor + KVKK fields + emailVerified NULL", async ({
  page,
}) => {
  // Eşsiz email + name + password
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `welcome-${stamp}@test.tarifle.local`;
  const name = "Welcome Test";
  const password = "welcome-passw0rd";

  await page.goto("/kayit");

  await page.getByLabel(/Ad Soyad/i).fill(name);
  await page.getByLabel(/E-posta/i).fill(email);
  await page.getByLabel(/Şifre/i).fill(password);

  // KVKK checkbox onayı (formda zorunlu)
  const kvkkCheckbox = page.getByLabel(/KVKK/i).first();
  await kvkkCheckbox.check();

  // Submit
  await page.locator('form button[type="submit"]').first().click();

  // Başarılı register sonrası anasayfa veya doğrulama yönlendirmesi
  await page.waitForURL(/\/(|dogrula|giris)/, { timeout: 15_000 });

  // DB doğrulaması: user oluştu mu
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      kvkkAccepted: true,
      kvkkVersion: true,
      passwordHash: true,
    },
  });
  expect(user).not.toBeNull();
  if (!user) return;

  createdUserId = user.id;

  expect(user.email).toBe(email);
  expect(user.name).toBe(name);
  expect(user.kvkkAccepted).toBe(true);
  expect(user.kvkkVersion).toBe("1.0");
  expect(user.emailVerified).toBeNull(); // verification flow sonra
  expect(user.passwordHash).not.toBeNull(); // bcrypt hash
});

test("welcome email i18n key'leri messages/tr.json'da tam tanımlı", async ({}) => {
  // Welcome email render'ı i18n key chain'e bağlı; key eksikse provider
  // crash etmez ama empty body ile mail gider. messages/tr.json'da tüm
  // beklenen key'lerin tanımlı olduğunu doğrula. (Unit test seviyesinde
  // de cover edilebilir ama burada full chain'i bağlama açısından kalsın.)
  const tr = await import("../../messages/tr.json");
  const en = await import("../../messages/en.json");

  const REQUIRED_KEYS = [
    "subject",
    "eyebrow",
    "title",
    "greetingNamed",
    "greeting",
    "intro",
    "feature1Title",
    "feature1Body",
    "feature2Title",
    "feature2Body",
    "feature3Title",
    "feature3Body",
    "blogHint",
    "cta",
    "footer",
    "textIntro",
    "textFeature1",
    "textFeature2",
    "textFeature3",
    "textBlog",
    "textFooter",
    "signature",
  ];

  const trWelcome = (tr.default.email?.welcome ?? {}) as Record<string, string>;
  const enWelcome = (en.default.email?.welcome ?? {}) as Record<string, string>;

  expect(Object.keys(trWelcome).length).toBeGreaterThan(0);
  expect(Object.keys(enWelcome).length).toBeGreaterThan(0);

  for (const key of REQUIRED_KEYS) {
    expect(trWelcome[key], `tr.json email.welcome.${key} eksik`).toBeTruthy();
    expect(enWelcome[key], `en.json email.welcome.${key} eksik`).toBeTruthy();
  }
});
