/**
 * One-off helper: seed a handful of notifications on a target user for
 * manual / preview testing. Run against `codex-import` branch or local
 * Neon, does NOT belong in production.
 *
 *   npx tsx scripts/seed-test-notifications.ts <email>
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";

neonConfig.webSocketConstructor = ws;
config({ path: ".env.local" });

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/seed-test-notifications.ts <email>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    console.log(`No user with email ${email}`);
    return;
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "VARIATION_LIKED",
        title: "Bir kullanıcı uyarlamanı beğendi",
        body: '"Fırın karnıyarık" uyarlamanı beğenen yeni biri var.',
        link: "/tarif/karniyarik",
      },
      {
        userId: user.id,
        type: "BADGE_AWARDED",
        title: "🌱 Yeni rozet: İlk Uyarlama",
        body: '"İlk Uyarlama" rozetini kazandın. Profilinde görebilirsin.',
        link: "/profil/me",
      },
      {
        userId: user.id,
        type: "REPORT_RESOLVED",
        title: "Raporun sonuçlandı",
        body: "Bildirdiğin içerik için inceleme tamamlandı. İçerik kaldırıldı; katkın için teşekkürler.",
      },
    ],
  });

  console.log(`✅ 3 notification eklendi: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
