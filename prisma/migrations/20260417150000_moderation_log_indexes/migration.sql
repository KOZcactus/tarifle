-- Moderation log sayfası için erişim desenleri.
-- createdAt DESC ana sıralama; moderatorId+createdAt tek-moderator drill-down;
-- targetType+action+createdAt chip filtre kombinasyonları için.

CREATE INDEX "moderation_actions_createdAt_idx"
  ON "moderation_actions" ("createdAt" DESC);

CREATE INDEX "moderation_actions_moderatorId_createdAt_idx"
  ON "moderation_actions" ("moderatorId", "createdAt" DESC);

CREATE INDEX "moderation_actions_targetType_action_createdAt_idx"
  ON "moderation_actions" ("targetType", "action", "createdAt" DESC);
