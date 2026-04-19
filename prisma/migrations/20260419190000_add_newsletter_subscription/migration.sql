-- AddNewsletterSubscription migration
--
-- Weekly newsletter opt-in table. Double-opt-in flow: CONFIRMING on
-- signup, ACTIVE after email confirm, UNSUBSCRIBED via unsubscribe
-- token. Hard-bounce path: SUSPENDED.
--
-- Soft delete (status transitions) instead of hard DELETE because
-- yasal audit: "bu kişi unsubscribe etmişti" kanıtı lazım olabilir.
--
-- Email index + status index + userId optional link. userId SET NULL
-- on user delete (abonelik email bazlı, user hesabı silinse bile
-- devam edebilir).

-- Enum.
CREATE TYPE "NewsletterSubscriptionStatus" AS ENUM (
  'CONFIRMING',
  'ACTIVE',
  'UNSUBSCRIBED',
  'SUSPENDED'
);

-- Table.
CREATE TABLE "newsletter_subscriptions" (
  "id"                TEXT NOT NULL,
  "email"             VARCHAR(255) NOT NULL,
  "status"            "NewsletterSubscriptionStatus" NOT NULL DEFAULT 'CONFIRMING',
  "confirmToken"      VARCHAR(100),
  "confirmTokenAt"    TIMESTAMP(3),
  "unsubscribeToken"  VARCHAR(100) NOT NULL,
  "locale"            VARCHAR(5) NOT NULL DEFAULT 'tr',
  "userId"            TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt"       TIMESTAMP(3),
  "unsubscribedAt"    TIMESTAMP(3),

  CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Uniques.
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key"
  ON "newsletter_subscriptions"("email");
CREATE UNIQUE INDEX "newsletter_subscriptions_confirmToken_key"
  ON "newsletter_subscriptions"("confirmToken");
CREATE UNIQUE INDEX "newsletter_subscriptions_unsubscribeToken_key"
  ON "newsletter_subscriptions"("unsubscribeToken");

-- Indexes.
CREATE INDEX "newsletter_subscriptions_status_idx"
  ON "newsletter_subscriptions"("status");
CREATE INDEX "newsletter_subscriptions_userId_idx"
  ON "newsletter_subscriptions"("userId");

-- Foreign key (optional user link).
ALTER TABLE "newsletter_subscriptions"
  ADD CONSTRAINT "newsletter_subscriptions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
