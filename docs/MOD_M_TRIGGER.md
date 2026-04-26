# Mod M (Marine) Tetik Şablonu

> Mod M = mevcut tariflerde marine süresini doğru modellemek. Detay
> kurallar `docs/CODEX_BATCH_BRIEF.md` **§19 Mod M**'de. Bu dosya
> sadece kısa tetik şablonu + Claude apply pipeline özet + aday liste
> pointer içerir.

## Özet

- **Aday**: 167 marine tarif (`docs/mod-m-candidates.md`, 14 keyword
  taraması, `scripts/find-marine-candidates.ts`)
- **Batch dağılımı**: 50 + 50 + 50 + 17 = 4 Codex batch
- **Kritik kural**: minimum 2 farklı web domain ile süre teyit zorunlu
  (halüsinasyon yasak). Detay brief §19.3.
- **Etki**: ~120-150 tarif RecipeTimeline 3-segment görsel hale gelir
  (Sauerbraten 3 gün marine demo pattern'i)

## GPT'ye atılacak mesaj (her batch için tek satır)

ChatGPT Max yeni Codex chat'inde önce `docs/CODEX_NEW_CHAT_INTRO.md`
"Bölüm 1" başlangıç mesajı paste edilir, Codex "Anladım" der. Sonra
batch tetik **tek satır**:

```
Mod M Batch 1.
```

Codex `docs/CODEX_BATCH_BRIEF.md §19` + `docs/mod-m-candidates.md`
referansından tüm kuralları okur, JSON output yazar
(`docs/mod-m-batch-1.json`). Sonraki batch'ler için sadece sayıyı
değiştir: `Mod M Batch 2.`, `Mod M Batch 3.`, `Mod M Batch 4.`

## Apply pipeline (Claude tarafı)

1. **Verify** (read-only, BLOCKED entry varsa rapor):
   ```
   npx tsx scripts/verify-mod-m-pairs.ts --batch 1
   ```
   Çıktı: `docs/mod-m-verify-report.md` (apply clean / SKIP / BLOCKED
   detay) + console summary.

2. **Kullanıcı onay**: Claude high/medium/low dağılımı + SKIP listesi
   + BLOCKED varsa ayrıntı sunar.

3. **Dev apply** (transaction + AuditLog):
   ```
   npx tsx scripts/apply-mod-m-batch.ts --batch 1 --apply
   ```

4. **Smoke test**: Sauerbraten + 3 random marine tarif 200 OK +
   RecipeTimeline 3-segment görsel doğrulama.

5. **Prod apply**:
   ```
   npx tsx scripts/apply-mod-m-batch.ts --batch 1 --apply --confirm-prod
   ```

6. **Sentry watch 24h**: regression var mı kontrol.

Detay (DB update mantığı, idempotent merge, audit metadata schema):
brief §19.4.

## Kapanış kriterleri

- 4 Codex batch tamamlandı, verify + apply PASS
- `find-marine-candidates.ts` yeniden koşulduğunda total > prep+cook
  olan tarif sayısı 100+ (eskiden 15)
- AuditLog `MARINE_APPLY` 100+ kayıt
- RecipeTimeline browser test marine'li tariflerde 3-segment doğru
  render (Sauerbraten pattern'i)
