-- Tarif detay sayfası (/tarif/[slug]) her açılışta ingredients + steps
-- çeker. Prisma ORM Postgres FK için otomatik index yaratmaz — bu
-- yüzden recipe_ingredients ve recipe_steps tablolarında `recipeId`
-- filter'ı seq scan ile çalışıyordu. 306 tarifte (2000+ ingredient,
-- 1500+ step) fark <1ms ama 1000+ tarif × ~7 kayıt ≈ 7k-10k satır
-- ölçeğinde milisaniye mertebesinde büyür.
--
-- Composite `(recipeId, sortOrder/stepNumber)` — Postgres Index Only
-- Scan yapabilir, hem filter hem sıralama tek geçişte biter.
--
-- Detection: npx tsx scripts/perf-audit.ts, case #7b seq scan raporladı.

CREATE INDEX "recipe_ingredients_recipeId_sortOrder_idx"
  ON "recipe_ingredients"("recipeId", "sortOrder");

CREATE INDEX "recipe_steps_recipeId_stepNumber_idx"
  ON "recipe_steps"("recipeId", "stepNumber");
