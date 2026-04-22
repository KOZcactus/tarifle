-- Profil gizlilik tercihleri (oturum 13).
-- 3 yeni boolean kolon User tablosunda, default true (mevcut davranisla
-- geriye uyumlu). Owner kendi profilinde her zaman gorur, baskalarina
-- gorunum bu ayarlara bagli.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showChefScore" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showActivity" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showFollowCounts" BOOLEAN NOT NULL DEFAULT true;
