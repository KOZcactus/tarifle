-- Add locale column to users table (i18n Faz 3 prep).
-- Default "tr" — existing users + Turkish-primary market. User opts into EN
-- via /ayarlar LanguagePreferenceCard or navbar selector; selection written
-- both to this column (logged-in users) and NEXT_LOCALE cookie (all users).

ALTER TABLE "users" ADD COLUMN "locale" VARCHAR(5) NOT NULL DEFAULT 'tr';
