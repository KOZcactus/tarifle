# Tarifle Shared Packages

> Phase 0 skeleton, oturum 33+. Web (Next.js root `src/`) + Mobile
> (`apps/mobile/`) ortak kullanır.

## Paketler

| Paket | Rol | Web | Mobile |
|---|---|---|---|
| `@tarifle/shared` | Types, enums, constants, Zod schemas | ✅ | ✅ |
| `@tarifle/api-client` | Fetch wrapper, Tarifle API endpoint'leri | ✅ | ✅ |
| `@tarifle/design-tokens` | Brand renkler, spacing, typography | ✅ (Tailwind config'de) | ✅ (StyleSheet) |
| `@tarifle/i18n` | TR + EN çeviriler | ✅ (next-intl) | ✅ (react-i18next) |

## Kurulum (Phase 0'da)

Root `package.json`'a workspaces eklenince çalışır:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Sonrası:

```bash
npm install      # tüm packages + apps/mobile dependency'lerini kurar
```

Şu an **standalone skeleton**, kullanım için workspaces migration
gerekir (Phase 0 ilk adım).

## Geliştirme prensibi

- **Single source of truth**: brand renk, type, çeviri her şey burada
- **No runtime deps to apps**: packages apps/'ı ya da web `src/`'i import etmez
- **Web migration**: web `src/lib/` ve `messages/` Phase 0'da gerekli
  yerlere migrate edilir (örn. allergen types, recipe types
  `@tarifle/shared`'a taşınır)

## Dokümantasyon

- Master plan: `docs/FUTURE_PLANS.md` § MOBILE APP MASTER PLAN
- Auth spec: `docs/MOBILE_AUTH_API_SPEC.md`
- Mobile app: `apps/mobile/README.md`
