# Mod R Reference Görseller (v2, oturum 33 Batch 1 sonrası)

Mod R Codex Batch N+ batch'lerinde bu görseller image-input olarak
prompt'a eklenir, aesthetic drift azaltılır.

## v2 Görseller (Batch 1 retry sonrası, lamb-free)

- **iskender-kebap.webp** (YEMEK, TR): porselen tabak, et + yoğurt
  + tereyağı sosu, glass table reflection
- **mojito.webp** (KOKTEYL, CU): highball glass, buz + nane
  yaprakları, glass table reflection
- **sucuklu-yumurta.webp** (KAHVALTI, TR): demir tava, sucuk dilimi
  + yumurta + maydanoz, glass table reflection

3 farklı recipe.type (YEMEK + KOKTEYL + KAHVALTI) çeşitliliği,
aesthetic kilidi sağlar.

## v1 (oturum 33 pilot, lamb'lı, ARCHIVED)

Eski reference (baklava + aperol-spritz + menemen) lamb'lı idi,
kullanıcı Batch 1 sonrası lamp YASAK kararı verdi. v1 silindi.
Pilot 5 görsel hâlâ `public/recipe-images/generated/` altında
prod'da live (DB recipe.imageUrl set), sadece reference'tan
kaldırıldı.

## Aesthetic kilit (v2 reference + brief §2 preamble)

- Round clear glass bistro table (transparent + reflective)
- Deep emerald green button-tufted velvet booth (background)
- Charcoal linen napkin corner at frame edge (left side)
- 3/4 high angle, ~35-40° above table
- Warm tungsten side lighting
- Dish 50-55% of frame width (tighter framing)
- **NO LAMP, NO CANDLE, NO BRASS HOLDER** (kullanıcı kararı)
- **NO STEAM, NO SMOKE, NO VAPOR** (kullanıcı kararı)
- 4:3 1600×1200 WebP

## Kullanım (Codex Batch N+)

Codex her image gen call'una bu 3 reference image'ı input olarak
verir:

```
[reference: iskender-kebap.webp, mojito.webp, sucuklu-yumurta.webp]
+ §2.1 FIXED PREAMBLE (verbatim)
+ §2.2 VARIABLE per recipe
```

Reference image'lar aesthetic kilidi sağlar: model yeni recipe için
görsel üretirken bu 3 görselin lighting/composition/booth/table/
no-lamp/no-steam pattern'ini kopya etmeye çalışır, drift minimum.

## Reference değişikliği zamanı

Yeni kalıcı kural eklenirse (örn. yeni renk paleti, yeni booth tipi),
reference v2 → v3 olarak yenilenir, yine 3 görsel + 3 type çeşitliliği.
