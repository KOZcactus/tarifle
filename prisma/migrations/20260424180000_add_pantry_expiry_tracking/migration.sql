-- Oturum 18: User opt-in pantry expiry tracking.
-- Default false, kullanıcı /ayarlar sayfasından açar.
ALTER TABLE "users" ADD COLUMN "pantryExpiryTracking" BOOLEAN NOT NULL DEFAULT false;
