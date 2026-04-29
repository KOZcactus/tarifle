# Recipe Images

Tarifle tariflerinin görselleri. Recipe.imageUrl alanı bu klasördeki dosyalara
relative path ile bağlanır (örn. `/recipe-images/generated/adana-kebap.webp`).

## Klasör yapısı

```
public/recipe-images/
├── generated/                       # Codex Mod R AI üretimi
│   ├── adana-kebap.webp
│   └── ...
└── manual/                          # Eren'in fotoğrafçı çekimleri (gelecek)
    └── (boş)
```

## Format

- **Tip**: WebP, quality 85
- **Boyut**: 1600×1200 (4:3)
- **Naming**: `{slug}.webp` (kebab-case, lowercase, ASCII)

## Workflow

Codex Mod R, görsel üretiyor: `docs/CODEX_MOD_R_BRIEF.md`

Batch öncesi Claude:
```bash
npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20
# → docs/recipe-image-prompts/queue-batch-N.json
```

Batch sonrası Claude:
```bash
npx tsx scripts/apply-recipe-images.ts --batch N --apply
# → recipe.imageUrl update (dev + prod)
```

## Hangi tarifin görseli var, hangisinin yok?

```bash
npx tsx -e "..." # imageUrl null sayısı kontrol
```

Veya `/admin/kalite` route → image coverage paneli (gelecek).
