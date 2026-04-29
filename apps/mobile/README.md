# Tarifle Mobile App (Expo)

> Phase 0 başlangıç skeleton, oturum 33+. Henüz development başlamadı.
> Web platform launch sonrası aktive olur.

## Stack

- **Framework**: Expo SDK 52+ (React Native 0.76+, New Architecture)
- **Workflow**: Managed (EAS Build/Submit/Update)
- **Router**: Expo Router (file-based)
- **State**: TanStack Query + Zustand (gerekirse)
- **Auth**: JWT + expo-secure-store (web Auth.js User tablosuyla aynı)
- **Storage**: expo-sqlite + AsyncStorage
- **i18n**: react-i18next (web ile shared TR/EN translations)
- **Design tokens**: shared (web --color-primary #a03b0f vs.)

## Phase 0 Kurulum (sonraki oturum)

### 1. Bağımlılıklar

```bash
cd apps/mobile
npm install
```

### 2. Expo Account + EAS CLI

```bash
npm install -g eas-cli
eas login
eas init  # apps/mobile/eas.json yaratır
```

### 3. iOS Simulator / Android Emulator

```bash
npm run ios      # macOS only, Xcode gerek
npm run android  # Android Studio gerek
npm run web      # Browser'da test
```

### 4. Expo Go ile telefon test

```bash
npm run start
# QR kod tara, Expo Go uygulaması ile
```

## Yapı

```
apps/mobile/
├── app/                       # Expo Router (file-based)
│   ├── _layout.tsx           # Root stack navigator
│   ├── index.tsx             # Anasayfa
│   └── (tabs)/               # Tab navigator (gelecek)
├── components/                # Mobile-specific UI
├── hooks/                     # Custom hooks
├── lib/                       # auth.ts, api-client wrapper, vs.
├── assets/                    # icon, splash, fontlar
├── app.json                   # Expo config
├── package.json
└── tsconfig.json
```

## Shared paketler (gelecek)

```
packages/
├── shared/                    # types, constants, validation schemas
├── api-client/                # Tarifle API wrapper (web ile ortak)
├── design-tokens/             # colors, spacing, typography
└── i18n/                      # translations.tr/en.json (web ile ortak)
```

Workspaces yapılandırması Phase 0'da eklenir (root package.json
`workspaces: ["apps/*", "packages/*"]`). Şu an standalone, mobile
geliştirme başlayınca migrate.

## Phase 0 ilerleme

- [x] Skeleton dosyalar (oturum 33)
- [ ] Apple Developer enrollment ($99/yıl, 1-3 hafta TR şirket)
- [ ] Google Play Console hesap ($25 one-time)
- [ ] EAS account + project init
- [ ] Workspaces migration (root package.json + lockfile)
- [ ] App icon + splash design (master 1024x1024)
- [ ] Privacy Policy + Terms URL doğrulama (web /yasal mevcut)
- [ ] Backend `/api/auth/mobile-*` endpoint implementation
  (spec: docs/MOBILE_AUTH_API_SPEC.md)

## Plan referansı

- Master plan: `docs/FUTURE_PLANS.md` § MOBILE APP MASTER PLAN
- Auth API spec: `docs/MOBILE_AUTH_API_SPEC.md`
- Image URL helper: `src/lib/recipe-image-url.ts`
- AASA stub: `src/app/.well-known/apple-app-site-association/route.ts`
- Assetlinks stub: `src/app/.well-known/assetlinks.json/route.ts`
