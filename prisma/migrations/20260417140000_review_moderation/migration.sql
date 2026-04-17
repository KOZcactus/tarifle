-- Review v2 (17 Nis 2026): moderation flags + notification hooks.
-- Mirrors Variation preflight/moderation shape so admin queue can render
-- both with the same component + notifications pipeline.

-- Extend NotificationType with review-specific events
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_HIDDEN';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_APPROVED';

-- Add moderation columns to reviews
ALTER TABLE "reviews" ADD COLUMN "moderationFlags" VARCHAR(200);
ALTER TABLE "reviews" ADD COLUMN "hiddenReason" VARCHAR(500);
