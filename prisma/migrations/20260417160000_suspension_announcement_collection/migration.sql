-- Admin ops v7 (17 Nis 2026):
-- 1) User suspension (suspendedAt + suspendedReason) — admin hesap askıya alır
-- 2) Collection hiding (hiddenAt + hiddenReason) — public koleksiyon moderasyonu
-- 3) Announcement table + AnnouncementVariant enum — site-wide banner

-- User suspension
ALTER TABLE "users" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "suspendedReason" VARCHAR(500);

-- Collection moderation
ALTER TABLE "collections" ADD COLUMN "hiddenAt" TIMESTAMP(3);
ALTER TABLE "collections" ADD COLUMN "hiddenReason" VARCHAR(500);

-- Announcement enum + table
CREATE TYPE "AnnouncementVariant" AS ENUM ('INFO', 'WARNING', 'SUCCESS');

CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000),
    "link" VARCHAR(500),
    "variant" "AnnouncementVariant" NOT NULL DEFAULT 'INFO',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_startsAt_endsAt_idx"
  ON "announcements" ("startsAt", "endsAt");
