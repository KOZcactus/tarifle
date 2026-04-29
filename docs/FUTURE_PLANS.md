# Tarifle Gelecek Planları

Bu dosya **sadece yapılmamış planlar** içerir. Bir madde bitince SİLİNİR
(değer-veren havuz kalır, değer-vermeyen arşiv oluşmaz).

**Bitmiş iş**:
- `docs/CHANGELOG.md`'ye özet eklenir (opsiyonel)
- `docs/PROJECT_STATUS.md`'nin "Yapılanlar" bölümüne tarih + commit ile
- Bu dosyadan silinir

**Prensip**: Her madde ya "Aktif (şu an çalışılıyor)" ya "Planlı
(site açılışı öncesi)" ya "Sonrası (site açılışı sonrası)" etiketli.

---

## 📱 MOBILE APP MASTER PLAN (oturum 33+, Planlı, site açılışı SONRASI)

**Statü**: Plan aşaması, henüz kod yok. Web platformu launch-ready
oluncaya kadar sadece planlama. Web açılışı + ilk 100-500 kullanıcı
trafiği toplandıktan sonra mobile app development başlar (~2-3 ay
sonrası tahmini).

**Vizyon**: iOS + Android native-feel uygulama, Tarifle web sitesinin
mobile-first reinterpretasyonu. Tarifte arama, mutfak modu (timer +
adım navigasyonu), bookmark senkronizasyon, AI Asistan, alışveriş
listesi, menü planlayıcı entegrasyonu. Launch sonrası organic kullanıcı
yakalamada %70+ mobile davranışına cevap.

### 1. Framework Kararı, Expo Managed (önerilen)

| Seçenek | Pros | Cons | Karar |
|---|---|---|---|
| **Expo Managed Workflow** | Single codebase iOS+Android, OTA updates (EAS Update), büyük ekosistem, hot reload, kolay learning curve, Claude/Codex destek güçlü | Native modül kullanımı sınırlı (config plugin gerek), Expo Go performans gap, cold start ~1.5-2s | ⭐ ÖNERİLEN |
| Expo Bare (eject) | Tam native control, herhangi bir lib | Config kompleks, eject sonrası geri dönüş zor | Sadece native modül zorunluluğu çıkarsa |
| React Native CLI | En esnek, native module direkt | iOS+Android setup ayrı, build sistemi karmaşık | Hayır, ekstra iş |
| Capacitor (Ionic) | Mevcut Next.js code'u WebView'da sarar, en hızlı ship | Native feel değil, performance sınırlı, "fake mobile" izlenimi | Hayır, kalite ihlali |
| Native (Swift + Kotlin) | En iyi performance, native HIG | 2x kod, 2x maintenance, 2x developer cost | Hayır, scope dışı |
| Flutter | Tek codebase, iyi performance | Dart öğrenme, Tarifle web ekosisteminden ayrı, React/TS knowledge transfer yok | Hayır |
| PWA enhancement | Sıfır maliyet, mevcut Next.js | App store yok, push notification iOS sınırlı, native feel yok | Yan-yan, web tarafında zaten manifest var ama yetmiyor |

**Karar**: **Expo Managed Workflow + EAS Build/Submit/Update**.
Sebep: kod paylaşımı web ile maksimum, dev hızı en yüksek, OTA update
store review beklemeden patch atabilir, Claude/Codex destekli geliştirme
en verimli.

**Versiyon hedefi**: Expo SDK 52+ (en güncel, React Native 0.76+, New
Architecture default).

### 2. Repo Strüktürü, Monorepo (npm workspaces)

| Seçenek | Pros | Cons | Karar |
|---|---|---|---|
| **Monorepo (npm workspaces, mevcut repo + apps/mobile)** | Shared types/utils/i18n/design-tokens, tek CI, single source of truth, single PR for cross-cutting changes | Build kompleks, mobile build zaman alabilir | ⭐ ÖNERİLEN |
| Monorepo (pnpm + Turborepo) | npm'den daha hızlı, daha iyi tooling | Mevcut npm setup'tan migration cost (CI, hooks, scripts) | Hayır, mevcut npm yeterli |
| Ayrı repo (tarifle-mobile) | Temiz scope, mobile takımı izolasyon | Cross-PR yok, types kopyalama drift, sync overhead | Hayır, kod paylaşımı kayıp |
| Same repo, mobile/ subfolder, no workspace | Basit, monorepo karmaşıklığı yok | Shared kod sembolik link veya copy-paste, drift riski | Hayır, monorepo'nun değeri var |

**Karar**: Mevcut Tarifle repo'sunda `apps/mobile/` + `packages/shared/`,
`packages/api-client/`, `packages/design-tokens/`, `packages/i18n/`
olarak npm workspaces. Mevcut Next.js `apps/web/`'e taşınmayacak (cost
yüksek), `tarifle/` root'unda kalmaya devam.

```
tarifle/
├── (mevcut Next.js root, dokunma)
├── apps/
│   └── mobile/                    # Expo app
│       ├── app/                   # Expo Router (file-based routing)
│       ├── components/
│       ├── hooks/
│       ├── package.json
│       ├── app.config.ts
│       └── eas.json
└── packages/
    ├── shared/                    # types, utils, constants
    ├── api-client/                # fetch wrappers, query hooks
    ├── design-tokens/             # colors, spacing, typography
    └── i18n/                      # tr.json, en.json (web'den kopya)
```

**Migration cost**: ~2-3 saat (root package.json'a workspaces eklemek,
mevcut imports'u packages'a taşımak, CI script güncelleme).

### 3. Phase 1 MVP Scope, Read + Auth + Bookmark (4-6 hafta)

**Dahil olanlar**:
- Tarif arama (fuzzy, mevcut API endpoint), filter (kategori, mutfak,
  diyet, allergen)
- Tarif detay sayfası (ingredients, steps, timer, hero image)
- Mutfak modu (büyük yazı + sesli okuma + timer otomasyon)
- Bookmark (web ile sync, push'lu favori listesi)
- Authentication: Google OAuth + email/password
- Profil sayfası (yapılan tarifler, bookmarks, koleksiyonlar)
- Offline cache (popüler 100 tarif + bookmark'lar)
- Push notification altyapı (henüz aktif kampanya yok)
- Dark/light mode (sistem teması takip)
- TR + EN dil

**Hariç olanlar (Phase 2'ye atılır)**:
- Tarif yorumlama (review yazma)
- Photo upload
- AI Asistan chat (planlı ama sonra)
- Menü planlayıcı yazma
- Alışveriş listesi yönetimi
- Topluluk feed (followed users)
- Editör başvurusu

**Kullanıcı flow**:
1. Splash screen
2. Onboarding (3 ekran, atlanabilir)
3. Auth (Google/email/skip-as-guest)
4. Ana ekran: arama bar + featured tarif şeritleri + kategoriler
5. Tarif detay: image + tab'lar (Malzemeler / Yapılış / Mutfak Modu)
6. Bookmark icon → guest ise login prompt, login ise tap toggle
7. Profile sekmesi: bookmarks + ayarlar + dil

### 4. Phase 2 Scope, Write + Social (4-6 hafta)

- Review yazma (yıldız + metin + isteğe bağlı foto)
- Photo upload (Cloudinary/S3)
- Yapılan tarif işaretleme (cooked tracking)
- AI Asistan v2 mobil interface (text + voice)
- Alışveriş listesi (offline-first, web sync)
- Menü planlayıcı (haftalık görsel grid)
- Topluluk feed (followed users + suggested cooks)
- Bildirimler (haftalık menü reminder, yeni follower, comment)
- Email doğrulama akışı

### 5. Phase 3 Scope, Advanced (4-8 hafta)

- Apple Watch / Wear OS companion app (timer + sıradaki adım)
- iOS 17+ widget (bugünün tarifi, alışveriş listesi)
- Siri Shortcuts / Google Assistant Actions ("X tarifi göster")
- Voice interaction (TTS hands-free okuma + cevap)
- Live Activity (mutfak modu lock screen timer)
- App Clips (iOS 14+ instant tarif preview without install)
- Deep links + Universal Links / Android App Links
- Pinterest-style photo grid feed (community photos)

### 6. Shared Code Strategy (Web + Mobile ortak)

| Package | İçerik | Web kullanır | Mobile kullanır |
|---|---|---|---|
| `packages/shared/` | TypeScript types, enums (Allergen, RecipeType), business constants (cuisine codes, category slugs), validation schemas (Zod) | ✅ | ✅ |
| `packages/api-client/` | fetch/axios wrapper, endpoint paths, request/response types, auth header injection | ✅ | ✅ |
| `packages/design-tokens/` | colors, spacing, typography, --color-primary token (web CSS var → JS object), shadows, border-radius | ✅ (CSS export) | ✅ (StyleSheet export) |
| `packages/i18n/` | translations.tr.json + translations.en.json, single source | ✅ | ✅ |

**Web'in mevcut struktürü** (Next.js src/) bozulmaz, sadece bazı
files packages'a taşınır + import path güncelleme. Estimated migration:
50-100 file path update.

### 7. Auth Strategy

**Web**: Auth.js v5 cookie sessions, server-side. Çalışıyor.

**Mobile**: JWT tabanlı, çünkü cookie cross-domain mobile'da problemli.

**Plan**:
- Web Auth.js'e mobile JWT endpoint ekle: `POST /api/auth/mobile-login`
  → email/password veya Google ID token al, JWT döndür (1 saat access
  + 30 gün refresh)
- Mobile: `expo-auth-session` Google OAuth → ID token → mobile-login
  endpoint'e POST → JWT al → `expo-secure-store`'a kaydet
- Email/password için mobile-login direkt
- Token refresh interceptor (api-client içinde)
- Logout: token'ı silme + sunucuda revoke endpoint
- Apple Sign-In: iOS App Store kuralı (Google Sign-In varsa Apple zorunlu)

**Endpoint listesi** (web tarafında ek yapılacak, ~3-5 dosya):
- `POST /api/auth/mobile-login`
- `POST /api/auth/mobile-refresh`
- `POST /api/auth/mobile-register`
- `POST /api/auth/mobile-logout` (revoke)
- `POST /api/auth/google-id-token`

### 8. Data + Cache Strategy

- **API**: Mevcut Next.js `/api/*` endpoint'leri (REST, JSON)
- **Client**: TanStack Query (React Query) v5
  - Stale-while-revalidate
  - Optimistic updates
  - Auto retry, deduping
- **Persistence**: AsyncStorage cache for query results (not sensitive)
- **Secure**: `expo-secure-store` for JWT tokens
- **Offline**: SQLite via `expo-sqlite` for bookmark + last 100 viewed
  tarifler full content
- **Image cache**: `expo-image` (built-in disk + memory cache)

**Cache invalidation kuralları**:
- Tarif listesi: 5dk stale
- Tarif detay: 1 saat stale
- Bookmarks: 1dk stale + optimistic
- User profile: 5dk stale
- Featured/trending: 1 saat stale

### 9. Design System Mobile

**Brand renkler** (web'den):
- `--color-primary: #a03b0f` (deep terracotta)
- `--color-secondary: #f4ead5` (warm cream)
- `--color-accent: #2d5016` (forest green)

**Typography**:
- Web: PP Editorial New (display), Inter (body)
- Mobile: System default (San Francisco iOS / Roboto Android) + custom
  display font (PP Editorial New) sadece h1/h2 için, performans

**Native feel pattern'leri**:
- iOS: HIG, blur backgrounds, swipe back gesture, haptic feedback
- Android: Material You dynamic colors (opsiyonel), bottom nav bar
- Common: Tab navigation (Ana sayfa / Ara / Bookmark / Profil)
- Theme: Light/dark mode otomatik (sistem)

**Komponent kütüphanesi**: Tamagui (cross-platform UI, Tarifle brand
kolay özelleştirme) veya direkt React Native + custom. **Karar**:
**custom + minimal libs** (NativeBase / Tamagui dependency lock-in
endişesi, kendi tasarımız özgün olsun).

### 10. Performance Hedefleri

| Metrik | Hedef |
|---|---|
| Cold start | < 2s |
| Tarif listesi scroll | 60fps sürekli |
| Image lazy load + placeholder | < 100ms placeholder visible |
| Bundle size (release) | < 30MB initial install (iOS), < 25MB (Android) |
| API response | < 300ms p50 (mevcut backend zaten hızlı) |
| TTFI (time to interactive) | < 1.5s after cold start |

**Optimizasyon teknikleri**:
- Image: WebP + adaptive sizing (Cloudinary transform veya Next.js
  image API mobile)
- List virtualization: FlashList (Shopify, çok hızlı)
- Hermes engine (Expo default)
- Code splitting: Expo Router automatic
- Memoization: useMemo + memo strategic kullanım

### 11. Test Stratejisi

| Layer | Tool | Kapsam |
|---|---|---|
| Unit | Jest + React Native Testing Library | Components, hooks, utils %80+ |
| Integration | Jest + RNTL + msw (mock API) | Screen flows, navigation, data fetching |
| E2E | Maestro | Critical user flows (login, search, bookmark, recipe view) |
| Visual regression | Storybook + Chromatic (opsiyonel) | Component visual freeze |
| Manual | TestFlight + Internal Testing | Real device beta |
| Performance | Flipper + React DevTools Profiler | Render perf |

**Coverage hedefi**: %80 unit + integration. E2E sadece critical paths.

### 12. CI/CD Pipeline

- **GitHub Actions**:
  - PR'da: lint, type-check, unit test, snapshot test
  - main push'ta: yukarıdakiler + Maestro E2E (Android emulator)
- **EAS Build**:
  - Preview profile: PR'da otomatik build, dahili distribusyon
  - Production profile: main push'ta tag'le otomatik build
- **EAS Submit**: tag push'ta App Store + Google Play submit
- **EAS Update**: minor patch'ler için OTA update (JS-only changes)

**Versioning**: SemVer (1.0.0 launch, 1.1.0 feature, 1.0.1 bugfix).
Build number: GitHub Actions run number.

### 13. App Store + Google Play Hazırlık

**Apple Developer Program**:
- $99/yıl
- Türk şirket için Apple Developer Program enrollment ekstra doğrulama
  isteyebilir (D-U-N-S number, vergi numarası), 1-3 hafta sürer
- Geç başlama riski: development başlamadan 1-2 hafta önce başvuru

**Google Play Developer**:
- $25 one-time
- Daha hızlı onay (1-2 gün)

**Submission gereklilikleri**:
- Privacy Policy URL (web'de zaten /yasal/gizlilik var)
- Screenshots (iPhone 6.5" + iPhone 5.5" + iPad 12.9" + Android phone +
  Android tablet, 5'er adet, ~25 görsel)
- App icon (1024x1024 master, iOS adaptive + Android adaptive)
- Description (4000 char), keywords, what's new, age rating
- Demo video (opsiyonel, store conversion artırır)
- Support URL, marketing URL
- TR + EN her ikisi için (App Store ülke ayrı listing)

**Review süresi**:
- Apple: 1-3 gün ortalama (ilk submission 1-2 hafta olabilir)
- Google: 1-3 gün

**Reddedilme riskleri**:
- Eksik privacy policy → kolay fix
- Test hesabı eksik → demo credentials brief
- Alkol/yetişkin içerik (kokteyl tarifler) → Age Gate (17+) gerek olabilir
- Apple guideline 4.0: "minimum functionality" → tarif listesi yetersiz
  bulunabilirse mutfak modu + offline cache değer gösterimi
- Sign in with Apple eksik → Google Sign-In varsa Apple zorunlu

### 14. Localization

- TR + EN (mevcut backend altyapısı zaten ikisini destekliyor)
- `react-i18next` veya `expo-localization` + custom hook
- Single source: `packages/i18n/translations.{tr,en}.json` web'den
  kopyalanır + diff sync
- Date/number formatting: Intl API (built-in)
- App Store listing: TR + EN ayrı

**Risk**: Web TR/EN updates mobile'a propagate edilmezse drift olur.
Çözüm: CI'da diff check, eksik translation key'i fail eder.

### 15. Analytics + Monitoring

- **Sentry React Native**: crash reporting + performance (web Sentry
  ile aynı project, ayrı release)
- **Custom event tracking**: Mevcut Vercel Analytics + custom backend
  endpoint, mobile'dan event push
- **App Store Connect Analytics**: install funnel, in-app event tracking
- **Google Play Console**: aynı

**Olay setlerinin önceliği** (Phase 1):
- App open
- Recipe view (slug bazlı)
- Recipe bookmark add/remove
- Search query
- Auth method
- Cold start time
- Crash + ANR

### 16. Push Notifications

- **Expo Notifications** (cross-platform abstraction)
- Backend send: `expo-server-sdk` Node lib, mevcut Next.js'e ek route
- **Use case'ler** (Phase 1: opt-in altyapı; Phase 2: aktif kampanya):
  - Yeni follower / yorum (Phase 2)
  - Haftalık menü hatırlatması (Phase 2)
  - Yeni öne çıkan tarif (Phase 2)
  - Bookmarked tarif uyarlaması yayınlandı (Phase 2)
- Token persistence: backend `User.expoPushToken` field
- Permission UI: ilk login sonrası soft prompt (red değilse "şimdi
  değil" → 7 gün sonra tekrar sor)

**Risk**: iOS push opt-in oranı %30-40 ortalama, low. Çözüm: değer
gösterimi, "neden push istiyoruz" copy.

### 17. Deep Links + Universal Links

- iOS Universal Links: `apple-app-site-association` JSON dosyası
  `https://tarifle.app/.well-known/apple-app-site-association`
- Android App Links: `assetlinks.json`
  `https://tarifle.app/.well-known/assetlinks.json`
- URL pattern: `https://tarifle.app/tarif/<slug>` → app açıksa app'te
  açar, kapalıysa web fallback
- Expo Linking: built-in support

**Risk**: SSL + DNS doğrulama, AASA dosyası deploy edildikten sonra
Apple cache 24 saate kadar tutar.

### 18. Görsel + Image URL Stratejisi

**Mevcut web**: `/recipe-images/generated/<slug>.webp` relative path,
Vercel CDN serve.

**Mobile için**: API response'da `imageUrl` absolute URL olmalı.
Backend transform:
```ts
imageUrl: r.imageUrl ? `https://tarifle.app${r.imageUrl}` : null
```

**Resize stratejisi**: Mobile farklı boyutlar ister (thumbnail 400px,
detail 800px, hero 1600px). Seçenekler:
1. Cloudinary on-the-fly resize (`?w=400&f=auto`)
2. Next.js Image API (`/_next/image?url=...&w=400`) - Vercel'in Image
   Optimization
3. Pre-generate multiple sizes during Mod R (3x storage cost)

**Karar**: **Next.js Image API kullan** (Vercel-native, no extra
service, automatic format conversion AVIF/WebP).

### 19. Offline Strategy

- TanStack Query persistor (AsyncStorage) cached queries
- expo-sqlite: bookmark + last 100 viewed tarifler full content
  (ingredients + steps)
- expo-image disk cache: tarif görseli kapalıyken görünür
- @react-native-community/netinfo: offline durum UI
- Offline-first bookmark: tap toggle local immediate, sync when online

**Trade-off**: Storage 50-200MB user device. UI'da "Offline cache
boyutu" + "temizle" buton.

### 20. Güvenlik

- **JWT secret rotation**: 30 gün cycle, refresh token revoke list backend
- **expo-secure-store**: Keychain (iOS) / Keystore (Android), AES-256
- **API rate limit**: Upstash Redis IP-based + user-id based (mevcut)
- **Certificate pinning**: pin SSL cert (advanced, opsiyonel)
- **Code obfuscation**: Hermes bytecode + Android R8 minify
- **Jailbreak/root detection**: opsiyonel (kullanıcı dostu olmayabilir,
  skip)
- **Biometric login**: expo-local-authentication (Touch ID / Face ID /
  Android biometric), JWT'yi biometric'le unlock

### 21. Öngörülebilen Sıkıntılar + Önlemler

| # | Risk | Olası etki | Önlem |
|---|---|---|---|
| 1 | Apple Developer enrollment Türk şirket için 1-3 hafta gecikme | Launch date kayar | Phase 1 başlamadan 4 hafta önce başvuru aç |
| 2 | App Store guideline 4.0 "minimum functionality" reddi | Submission reddi | Phase 1'e mutfak modu + offline + push notification koy, "tarif görüntüleyici" değil "uygulama" pozisyonla |
| 3 | Sign in with Apple eksik (Google varsa zorunlu) | Submission reddi | Phase 1'de hem Google hem Apple SignIn ekle |
| 4 | Apple In-App Purchase (gelecek monetization) | %30 Apple cut | Launch'ta monetization yok. 6+ ay sonra Pro tier düşünülürse external web checkout (kullanıcı browser'a yönlendir, Apple kuralı ihlali değil "digital good" değilse) |
| 5 | Çocuk + alkol tarif çakışması (kokteyl + 17+ rating) | Age gate gerek | App age rating 17+ koy (alkol tarif var), App Store kategori "Food & Drink" |
| 6 | iOS 17+ Cookie blocking (web auth değil mobil JWT'yi etkilemez ama WebView varsa) | Auth break | WebView kullanma, native screens |
| 7 | Web TR/EN translations sync drift | Mobile farklı text gösterir | CI'da diff check, packages/i18n single source, missing key fail |
| 8 | Image URL relative → absolute dönüşüm her endpoint'te yapılmazsa | Broken image | API middleware ile transform, single layer |
| 9 | Push notification iOS opt-in oranı düşük (~30-40%) | Engagement düşük | Soft prompt + value-first copy, opt-in 2. session sonrasında |
| 10 | Universal Links DNS/SSL/AASA cache 24 saat | Deep link çalışmaz | Phase 1 launch öncesi 1 hafta önce AASA deploy + test |
| 11 | EAS Build ücretli ($99/ay production) | Aylık fix gider | Phase 1 launch öncesi gerekli, hobby plan ($29) Phase 0'da yetebilir |
| 12 | TestFlight 90-day expiry her beta build | Beta takıma sürekli yeni build push | 30-day cadence release notes ile |
| 13 | Apple Watch + Wear OS companion ekstra geliştirme | Phase 3 scope büyür | Phase 1+2 launch sonrası analytics ile değerlendir, gerekiyorsa eklenir |
| 14 | App icon design eksik | Submission gecikir | Phase 0'da designer brief, master 1024x1024 + 17 farklı boyut hazırlat |
| 15 | Splash screen brand uyumsuz | Kötü ilk izlenim | Splash design + Lottie animation Phase 0'da hazırlat |
| 16 | Crash rate yüksek launch sonrası | App Store rating düşer | Sentry + uyarı eşiği, aşıldığında EAS Update ile hotfix |
| 17 | Bundle size > 50MB | Cellular download red flag, conversion düşer | Hermes + image asset optimization + tree-shake unused libs, hedef <30MB |
| 18 | Recipe content sync timing (web update mobile'a yansımaz) | Stale tarif content | TanStack Query stale time + manual pull-to-refresh |
| 19 | Search performance 3729 tarifte client-side fuzzy | Lag | Server-side fuzzy mevcut (pg_trgm), mobile sadece API çağırsın, client-side fallback minimum |
| 20 | KVKK + GDPR compliance Phase 1 | Legal risk | Web'de zaten KVKK altyapısı var (delete-account, data export), mobile aynı endpoint'leri kullanır |
| 21 | Beta tester eksik | Real-world bug missing | Phase 0 son haftada 10-20 beta tester davet (sosyal medya) |
| 22 | OTA update bozar | Critical bug propagate | Staged rollout (5% → 25% → 100%), rollback ready |
| 23 | iOS App Tracking Transparency (ATT) prompt | %50+ opt-out | ATT prompt sadece gerçekten gerekirse, "no tracking" duruşu MARKETING'de değer |
| 24 | Push notification permission iOS prompt erken | Permanent deny | İlk session'da SORMA, 2. session'da soft inline ask |
| 25 | App Store listing copy zayıf | Conversion düşük | Phase 0 son hafta App Store optimization (ASO) keywords + screenshot copy A/B |
| 26 | Apple Sign-In implementation karmaşık | Bug + reddi | Phase 0 başlamadan önce Apple Developer dokümantasyonu okuyup POC yap |
| 27 | EAS Update binary değişiklikleri kapsamaz | "Update available" prompt yanlış işler | Update strategy dokümante et: minor → OTA, major → store update |
| 28 | iOS 18+ widget API değişikliği | Phase 3 widget bozulur | Phase 3 başlamadan platform-spesifik test |
| 29 | Mobil-spesifik feature creep (örn. Apple Watch ihtiyaç olmadan eklenir) | Phase 1 gecikir | Phase 1 scope KILIT, Apple Watch + widget Phase 3'e atılır |
| 30 | Cross-platform tutarsızlık (iOS pixel-perfect, Android farklı) | Quality variance | Component layer'ında platform-specific styles + visual regression test |

### 22. Timeline + Cost

**Timeline tahmini** (web platform launch sonrası başlar):

| Phase | Süre | Çıktı |
|---|---|---|
| Phase 0 (setup + design + Apple/Google enrollment) | 2-3 hafta | Repo struktürü, Expo init, design system port, app icon + splash, store listings |
| Phase 1 MVP (read + auth + bookmark) | 4-6 hafta | TestFlight + Google Play Internal Testing |
| Phase 2 (write + social) | 4-6 hafta | Public beta |
| Phase 3 (advanced) | 4-8 hafta | Production launch v1.0 |
| **Toplam** | **3.5-5 ay** | iOS + Android public release |

**Cost** (aylık running):
- Apple Developer: $99/yıl ≈ $8/ay
- Google Play: $25 one-time
- EAS Production: $99/ay (Hobby $29 erken Phase için)
- Sentry React Native: $0 (mevcut Sentry plan'a dahil)
- Cloudinary (eğer transform burası kullanılırsa): $89/ay Pro
- App icon + design (one-time): $200-500 freelance designer
- Beta tester ödüllendirme (opsiyonel): $50-100 hediye kart

**Toplam aylık running**: ~$200/ay (development sonrası)
**One-time setup**: ~$300-700

### 23. İlk Adımlar (Phase 0 başlangıcı, web launch sonrası)

1. **Hafta 1**:
   - Apple Developer Program enrollment başvuru (Türk şirket için
     D-U-N-S + vergi)
   - Google Play Console hesap aç
   - `apps/mobile/` Expo init: `npx create-expo-app@latest --template`
   - Workspace setup (root package.json'a workspaces, packages/ taşıma)
   - EAS account + CLI setup
2. **Hafta 2**:
   - `packages/design-tokens/` build (web CSS vars → JS tokens)
   - `packages/api-client/` skeleton (axios + interceptor)
   - App icon + splash screen design (designer)
   - Privacy Policy + Terms of Use + KVKK store URL doğrulama
3. **Hafta 3**:
   - Auth flow POC (Google Sign-In + email/password + Apple Sign-In)
   - Backend `/api/auth/mobile-*` endpoint'leri (web tarafında)
   - Token storage (expo-secure-store)
   - Test build EAS Preview

Phase 0 sonu **Phase 1 MVP development başlangıcı için hazır**.

### 24. Mobile App Plan = Yeni MOBILE_APP_PLAN.md (gelecek)

Bu master plan FUTURE_PLANS.md'de kaldıkça aşamalı olarak ayrı bir
`docs/MOBILE_APP_PLAN.md`'ye taşınır (web `TARIFLE_ULTIMATE_PLAN.md`
single source of truth pattern'i ile aynı). Phase 0 başlamadan önce
ayrı doküman + bu blok FUTURE_PLANS'tan silinir.

### 25. Şu an YAPMA listesi

- Henüz Expo init etme (web platform launch öncesi)
- Apple Developer enrollment etme (timing önemli, 90 gün önce)
- App icon design sipariş etme (brand pattern web'de stabilize olsun)
- Beta tester recruit etme (web 100+ kullanıcı toplandıktan sonra)
- Mobile-specific marketing kampanyası (web launch + organic growth
  öncesi anlamsız)

### 26. Şu an YAP listesi (Phase 0 öncesi, web launch öncesi)

- Web tarafında recipe.imageUrl tüm featured 390 doldur (Mod R cycle)
- Web tarafında `/api/auth/mobile-*` endpoint'leri TASARLA (kod yazma,
  sadece spec)
- Web tarafında image URL absolute transform helper (mobile-ready API
  response)
- Web tarafında `apple-app-site-association` + `assetlinks.json` rota
  hazır olsun (Phase 0'da app ID set edilince doldurulur)
- Web tarafında `recipe.imageUrl` field zaten mevcut, mobile için
  ek bir `recipe.imageThumbnail` (400x300) field düşünülebilir
  (cuisine listing fast load için)

---

## ✅ Oturum 32 SONU FINAL (29 Nis 2026), 26 commit, MARATON

**Oturum 32 final başarı zinciri (26 commit, prod 3508→3714, +206 tarif):**

1. **Mod A v2 40a-e + 41a-d apply (prod 3508 → 3714, +206 tarif)**:
   100 tarif 40a-e + 84 tarif 41a-d (16 41e bekleniyor). Retrofit
   pipeline ilk kullanım: 4 KRİTİK REJECT yakalandı + 4 yeni tarif
   ile çözüldü (tabriz-kufteh-tabrizi, surabaya-rawon, cape-
   waterblommetjie-bredie, bitlis-glorik).

2. **audit-deep 62→0 CRITICAL kapanış** (commit 93a9f7a + 09989f3 +
   d85be7d): 56 vegan tag fix + 26 allergen ek + algoritma rafine
   (yerine handler + kekiği/pirinç krakeri excludePatterns + balığı
   possessive + Turkish-aware word boundary + kete YUMURTA + tarka-
   dal SUT kaldır).

3. **GATE A 792→1 + GATE B 10→0** (commit 8aba17c + 245b889 +
   74c5fda): 771 moderate fix toplu + 21 extreme manuel fix +
   GATE B Turkish word boundary + lavaş keyword çıkar.

4. **IIFE format homojenleştirme** (commit f3a99c9): 63 IIFE flat
   array, scripts/lib/recipe-helpers.ts modülü, -740 satır
   boilerplate, Codex tetik şablonu IIFE-free güncelleme (commit
   05f097e).

5. **Source-DB drift 13 SKIP entry kalıcı temizlik** (commit 4d82a65
   + ed09971 + 6c0a4ca): sync-11-skip-source format-aware + 2 final
   ingredient ek (Tereyağı). check-allergen-source SKIP_FINDINGS boş.

6. **60. blog yazısı** (commit b285ea3): "Sebze Pişirme Teknikleri"
   1478 kelime, 5 temel teknik + Maillard vs karamelizasyon.
   docs/all-recipe-titles.md dump pipeline ile sync (commit a8a39cb).

7. **Codex tetik şablonu IIFE-free güncelleme** (commit 05f097e):
   docs/CODEX_BATCH_BRIEF.md + docs/CODEX_NEW_CHAT_INTRO.md helper
   modülü direktifi.

**Aktif/Planlı (oturum 33+):**

- **Codex 41e teslim bekle/apply** (kalan 16 tarif, 41 paket toplam
  100/100 tamamlama)
- **Codex 42a-42e tetik** (Mod A v2 sonraki 100 tarif, brief §5.0.0
  default scope, tek mesajla `Mod A v2. Batch 42a-42e.` tetiği)
- **4. blog yazısı** (taze ot rehberi / çikolata bilimi / peynir
  eşleştirme; mevcut 60 blog, kategori dengesi pisirme-teknikleri 17,
  malzeme-tanima 17, mutfak-rehberi 19)
- **GATE A 1 minor + GATE B 2 false positive triage** (ROI düşük,
  audit-recipe-quality.ts kalan minor finding'ler)
- **Lhci regression baseline kontrol** (oturum 32 sonu, 206 yeni
  tarif sonrası, 5 URL × 2 run)
- **CI hata teşhisi** (gh run list failed run'ları, ROI düşük)

---

## ✅ Oturum 32 SONU (29 Nis 2026), 9 commit, audit-deep 62→0 + algoritma rafine

**Oturum 32 final başarı zinciri (9 commit, prod 3508→3617 + audit PASS):**

1. **Mod A v2 40a-e tam apply (commit ce4d305 + 91801b3 + 2fae2d3)**:
   100 yeni tarif, 7 GATE validate PASS, 40d+40e derin 20/20 PASS,
   40a/b/c spot 15/15 PASS, 5 manuel fix, full pipeline dev+prod seed
   + hunger-bar + nutrition recompute + diet-score + tarif-listesi
   re-dump. 40e prod doğrulama 20/20 nutrition + 20/20 diet.

2. **60. blog yazısı (commit b285ea3)**: "Sebze Pişirme Teknikleri"
   pisirme-teknikleri 16→17, 1478 kelime, 5 temel teknik + Maillard
   vs karamelizasyon + 7 otoriter kaynak.

3. **audit-deep 62 → 0 CRITICAL kapanış (commit 93a9f7a + 09989f3 +
   d85be7d)**: 56 vegan tag fix (RecipeTag relation) + 26 allergen
   ek + algoritma rafine ("X yerine Y" handler, "kekiği" / "pirinç
   krakeri" excludePatterns) + kete YUMURTA gerçek bug fix + tarka-
   dal SUT kaldır + 105 AuditLog + 11 source-DB drift SKIP.

**Aktif/Planlı (oturum 33+):**

- **Codex Batch 41a-41e teslimini bekle/apply** (kullanıcı tetikledi,
  5-6 saat ardışık, geldiğinde validate-mod-a-batch + apply pipeline)
- **Source-DB ingredient sync** (scripts/sync-source-from-db.ts ile 11
  SKIP_FINDINGS drift'i kalıcı temizle, ROI orta, ~30-45dk)
- **GATE A süre algoritma rafine** (totalMinutes formülü + marine
  pattern exclude, ROI orta)
- **CI hata teşhisi** (gh run list failed log'lar, ROI düşük)
- **Yeni blog 4** (taze ot rehberi / çikolata bilimi / peynir
  eşleştirme; mutfak-rehberi 19, malzeme-tanima 17, pisirme-teknikleri
  17, kategoriler dengeli)

---

## ✅ Oturum 32 BAŞLANGIÇ (29 Nis 2026), Mod A v2 Batch 40a-40e ilk uygulama tam apply

**Oturum 32 başarı (3 commit, prod 3508 → 3617):**

1. **Mod A v2 ilk uygulama prod canlı (100 yeni tarif)**: 5 paket × 20 =
   100 tarif (40a-40e). 7 GATE validate PASS (GATE 1 0 dupe, GATE 1.5 10
   whitelist, GATE 4/5/6/7 0). 40d+40e derin 40/40 PASS + 40a/b/c spot
   15 PASS. 5 manuel fix: tekirdag-hayrabolu totalMinutes 115→100 +
   porto-francesinha yumurta klasik servis + sanliurfa-pitpit slug
   normalize + warsaw-bigos GLUTEN→[] (allergen-source-guard çakışması)
   + types fix.

2. **Apply pipeline tam akış**: dev seed 109 INSERT + prod seed 109
   INSERT (--confirm-prod) + hunger-bar dev 168 + prod 153 + nutrition
   recompute 3617 row %98 matchedRatio + diet-score 36170 işlem + tarif-
   listesi.txt prod re-dump 3617. Pre-push 6 katman temiz tüm 3 commit.

3. **Yeni tool**: scripts/check-batch-recipe.ts (single-recipe inspector,
   Mod A v2 manuel kalite kontrol disiplini için kalıcı).

**Aktif/Planlı:**

- **Codex Batch 41a-41e tetik** (Mod A v2 sonraki 100 tarif, 5-6 saat
  ardışık paralel)
- **3. blog yazısı** (sebze pişirme teknikleri: blanching/glazing/
  braising/roasting/sauté, pisirme-teknikleri kategorisini dengeler 16→17,
  Mod K essential keşifleriyle bağ)
- **audit-deep 62 önceden var olan CRITICAL paket** (mevcut prod
  tariflerinde RECIPE_CONSISTENCY 36 + ALLERGEN_ACCURACY 26, sonraki
  oturum bir paket halinde fix)
- **GATE A süre algoritma rafine** (totalMinutes formülü + marine
  pattern exclude, ROI orta)
- **CI hata teşhisi** (gh run list, ROI düşük)

---

## ✅ Oturum 31 SONU FINAL (28 Nis 2026, oturum 30 aynı gün devamı), major kapanışlar

**Oturum 31 final başarı zinciri (~28 commit, 658 prod kayıt iyileşme):**

1. **İki audit kuyruğu da %100 KAPANIŞ 🏁🏁** (verify-tracked
   0/116 + verify-untracked jenerik scaffold 0/127, paketi 25-43
   19 ardışık paket).

2. **15 ardışık mini-rev paketi (29-43) + 99 tarif**: Mini-rev
   kümülatif 190 → **289** (+99). 8 yeni boilerplate pattern keşfi
   (find-new-boilerplate-patterns.ts). 5 SLUG LEAK + 1 'Baharatlar'
   REMOVE + 1 DATA ANOMALI + 1 DUPLICATE STEP FIX.

3. **Mod A v2 Quality-First pipeline**: 20 tarif × 5 paket + 7 GATE
   brief güncelleme (CODEX_BATCH_BRIEF.md §5.0.0 + GATE 1.5
   whitelist). Validate tool (scripts/validate-mod-a-batch.ts auto
   git diff slug detect). İlk uygulama: Codex Batch 40a-40d 60 tarif
   teslim, 5+2 KRİTİK REJECT retrofit doğru çözüldü, 60 tarif
   apply-ready.

4. **Yeni audit metodoloji 5 GATE (scripts/audit-recipe-quality.ts)**:
   GATE B 254 prod allergen ek (TIBBİ RİSK fix); GATE C 3 macro
   scale-up; GATE D 4 cuisine fix (606→0 word boundary); GATE E 46
   featured iniş (%11.3→%10.0). Toplam 307 prod quality fix.

5. **2 yeni blog yazısı (57 → 59)**: Aromatik Sebze Tabanı + Pirinç
   Çeşitleri Rehberi. Mod K essential keşifleriyle bağ.

6. **SEO landing batch 6 + 7 (48 → 60 entry)**: 12 yeni cuisine +
   3 diet revize. Top SEO derinlik 34 → 49 cuisine kapsama.

7. **Lhci 10/10 PASS (2 kez kontrol)**: oturum 31 boyunca 28 commit
   sonrası baseline regression yok.

**Critical essential keşifler oturum 31 boyunca (~25)**: Levant
musakhan-bowl soğan, Sichuan denge toz şeker+susam yağı, Peru
sofrito kimyon, K.Maraş Maraş biberi, Welsh rarebit Worcestershire,
Rus syrniki toz şeker (smetana servis), Edirne saray kuş üzümü+badem
+tarçın, iç pilav kuş üzümü, US BBQ paprika rub, tortilla española
sarımsak, Hatay zahter sumak+nane, Kilis kuru nane, Trabzon dible
sarımsak, Şanlıurfa demirhindi limon suyu+toz şeker, Macar túrós
batyu vanilya+limon kabuğu, Kars otlu kete lor peyniri, Erzurum su
böreği süt+tuz, Brezilya pamonha hindistan cevizi sütü, Norveç
rømmegrøt tereyağı (smjør), Avustralya brunch frenk soğanı, Çin tea
egg karanfil+koyu soya, Polonya placki soğan, mısır ekmeği kabartma
tozu, İspanya tortilla con cebolla soğan, Welsh rarebit bake fırın
varyantı.

**Push disiplini**: ~28 commit, batch'lerle (6+3+1+2+1+2+2+1+1+1+1+
1+...). Pre-push 6 katman temiz tüm commit. 1 em-dash guard
yakaladı (paketi 43 comment'te düzeltildi).

---

## ✅ Oturum 31 SONU başlangıç (oturum 30 aynı gün devamı), major kapanışlar

**İki audit kuyruğu da %100 KAPANIŞ 🏁🏁**:
a) **Verify-tracked MAJOR kuyruk** (mod-k-verify-report-*.md): 0/116
   (paketi 24'te kapandı, oturum 30).
b) **Verify-untracked jenerik scaffold kuyruk** (find-jenerik-
   scaffold.ts 21 pattern): 0/127 (paketi 25-43, 19 ardışık paket).
   Oturum 30 keşif (13 pattern, 79 hit) + oturum 31 yeni 8 pattern
   eklemesi (find-new-boilerplate-patterns.ts ile keşif, 21 pattern
   total).

**15 ardışık mini-rev paketi (29-43) + 99 tarif** (oturum 31): Mini-
rev kümülatif 190 → **289** (+99, %52 sıçrama). ~280 ingredient_add
+ 1 ingredient_remove + ~580 step replace + ~85 BOILERPLATE LEAK
FIX + 5 SLUG LEAK FIX + 1 DATA ANOMALI FIX ('Su 0 amount') + 1
jenerik 'Baharatlar' REMOVE + 1 DUPLICATE STEP FIX (paketi 41
tulumlu-lor 'Karabiber serpip' iki defa).

**Mod A v2 Quality-First brief güncellemesi (oturum 31, ZORUNLU
default)**: 13 mod cycle ve ~1700 prod correction sonrası kök neden
tespiti. v2 = 20 tarif × 5 paket (Na-Ne) + 7 GATE (uniqueness +
kaynak + klasik formul + step↔ingredient match + anti-boilerplate
21 pattern + slug-leak yasak + em-dash yasak). docs/CODEX_BATCH_
BRIEF.md §5.0.0 yeni alt başlık.

**Kritik essential keşifler** (klasik kanonik formul tamamlama):
Levant musakhan-bowl soğan, Sichuan denge toz şeker+susam yağı, Peru
sofrito kimyon, K.Maraş yöre Maraş biberi, Welsh rarebit Worcestershire,
Rus syrniki toz şeker (smetana servis), Edirne saray kuş üzümü+badem+
tarçın, iç pilav kuş üzümü, US BBQ paprika rub, tortilla española
sarımsak, Hatay zahter sumak+nane, Kilis kuru nane, Trabzon dible
sarımsak, Kayseri yağlı kete maydanoz, Bartın karalahana mısır unu,
Şanlıurfa demirhindi limon suyu+toz şeker, Macar túrós batyu vanilya+
limon kabuğu, Kars otlu kete lor peyniri, Erzurum su böreği süt+tuz,
Brezilya pamonha hindistan cevizi sütü, Norveç rømmegrøt tereyağı
(smjør), Avustralya brunch frenk soğanı, Çin tea egg karanfil+koyu
soya, Polonya placki soğan, mısır ekmeği kabartma tozu, İspanya
tortilla con cebolla soğan.

**Push disiplini**: ~17 commit (15 mini-rev + 1 brief Mod A v2 + 1
docs oturum 31 SONU başlangıç) batch'lerle (6+3+1+2+1+2+2). Pre-
push 6 katman temiz tüm commit. 1 em-dash guard yakaladı (paketi 43
comment'te düzeltildi).

---

## ✅ Oturum 30 SONU (28 Nis 2026, oturum 29 aynı gün devamı), major kapanışlar

**Verify-tracked MAJOR kuyruk %100 KAPANIŞ (paketi 24, 116/116)**:
Mod K verify reports'tan tracked tüm 116 MAJOR slug kapatıldı. Paketi
24 = 6 tarif atypical kapanış (kalan tüm verify-tracked MAJOR slug'lar).

**Yeni audit metodoloji**: `scripts/find-jenerik-scaffold.ts` ile prod'da
13 boilerplate pattern içeren slug tarama. 79 hit. Paketi 25-28 ile top
28 slug kapatıldı (79 → 51 kalan).

**5 ardışık mini-rev paketi (24-28) + 34 tarif kapatıldı**: Mini-rev
kümülatif 156 → 190 (+34). 168 ingredient_add + 220 step replace + 4
amount change. 1 cuisine fix (paketi 25 tavuklu-noodle tr→cn).

**Kritik fix'ler**: 1 KRİTİK TYPO (paketi 24 Köplenmiş→Közlenmiş +
közlenmiş kapya biber), 4 KRİTİK TUTARSIZLIK (paketi 24 + 25 + 28 + 23
TRIPLE), 4 BOILERPLATE LEAK FIX (paketi 24, 25, 28 + jenerik scaffold
ortak), 1 ŞERBET EKSIK FIX (paketi 24 Tekirdağ revani), 1 KIBE-MUMBAR
FULL pattern (musakhan).

**Lhci regression baseline**: Oturum 30 başında 5/5 URL × 2 run = 10
run PASS (perf ≥0.85 + a11y ≥0.95 + bp ≥0.9 + seo ≥0.95). Oturum 29
SONU sonrası baseline güvende.

**Push disiplini + lint fix kalıcı çözüm**: 8 commit prod'a push (3+4+
1 docs). `eslint.config.mjs`'e `logo/**` ignore kalıcı eklendi (her
yeni .cjs için eslint-disable yorumu yerine config tek satır).

---

## ✅ Oturum 29 SONU (28 Nis 2026, oturum 28 aynı gün devamı), major kapanışlar

**8 mini-rev paketi (paketi 16-23) + 56 tarif kapatıldı**: Mini-rev
kümülatif 100 → **156** (+56). Kuyruk ~110 → **~54**. Pattern
`scripts/fix-mini-rev-batch-{16..23}.ts`.

**5 KRİTİK CI keşif**: Mersin Tantunisi CI 211 + Uşak Tarhanası CI 209
+ Şanlıurfa İsotu CI 109 + Antep Katmeri CI 86 (çatışma fix) + Adana
Şalgam Suyu CI 53 + Beypazarı Kurusu CI 65 + Sivas Gürün CI 269.

**2 DATA CORRUPTION FIX**: paketi 17 musakhan + paketi 23 Batman firik
(her ikisinde de "kuzu pembesi tabaka halinde" scaffold leak, tavuk
tariflerinde kuzu cümle).

**1 TRIPLE TUTARSIZLIK** (paketi 23 Ardahan): step 2 domates+yeşillik
+ step 3 limon + step 5 soğan listede yoktu (3 ayrı tutarsızlık tek
tarifte).

**8 TUTARSIZLIK + 4 BOILERPLATE LEAK + 3 SÜRE FIX + 1 GIDA GÜVENLİĞİ +
1 TYPE FIX + 1 KIBE-MUMBAR FULL**: SÜRE FIX (keşkek 50→540 dk + sikhye
45→275 dk + papatya 12→50 dk), GIDA GÜVENLİĞİ (kayısı çekirdeği
amigdalin REMOVE, EFSA 2016 siyanür), TYPE FIX (Bingöl fasulye ezmesi
SOS→APERATIF).

**SEO landing batch 5**: 5 yeni cuisine entry (brezilya/peru/iskandinav
/rus/macar) + 20 yeni FAQ. seo-copy-v1.json 43 → 48 entry, top SEO
derinlik 29 → 34 kapsama.

**Lhci regression baseline**: 5 URL × 2 run = 10 run PASS (perf
≥0.85 + a11y ≥0.95 + bp ≥0.9 + seo ≥0.95). Mod K + 8 mini-rev sonrası
baseline regression YOK.

---

## ✅ Oturum 28 SONU (28 Nis 2026), major kapanışlar

**Mod K v2 71/71 (%100 KAPANIŞ)**: 1a-36a + 22b/24b yeniden teslim
hepsi verify+apply. Kümülatif Mod K correction prod ~1701. Codex
queue temiz, ek Mod K batch işi kalmadı.

**Test Campaign 8/8 KAPANIŞ**: K8 yapıldı + 1 P1 TTS bug fix
(`60439df`, useLocale + ttsLang dynamic + voice-picker BCP-47).

**4 yeni cuisine code**: cl Şili (paketi 8) + ge Gürcü (paketi 9) +
at Avusturya (paketi 11) + ca Kanada (paketi 14). CUISINE_CODES
37 → 41. Cuisine tests 46 → 58 PASS.

**8 mini-rev paketi (paketi 8-15)**: 55 tarif kapatıldı, kümülatif
100. 38 KRİTİK fix (oturum 27: 3 + oturum 28: 35 yeni). Pattern
`scripts/fix-mini-rev-batch-{8..15}.ts`.

**5 SEO entry FAQ tamamlandı**: atistirmaliklar + sebze-yemekleri +
smoothie-shake + soslar-dippler + portekiz, 20 q+a (paketi 14
commit `c0dbf7b`).

**5 prod bug fix**: RecipeCard "0" + Home CTA + SEO Sentry crash
+ TTS K8 + picanha nutrition.

**Prod nutrition recompute prod**: 3508 row, %98 matchedRatio>=0.5
coverage.

---

## 🎯 Aktif (oturum 31+ kısa vade)

### Mini-rev kuyruk (verify-tracked %100 + verify-untracked %100 🏁)

Oturum 31 sonrası mini-rev kümülatif **241**. İki ana audit kuyruğu
da %100 kapalı:
- **verify-tracked MAJOR kuyruk** (mod-k-verify-report-*.md): 116/116
  KAPANDI (paketi 24, oturum 30).
- **verify-untracked jenerik scaffold kuyruk** (find-jenerik-scaffold.
  ts, 13 boilerplate pattern): 79+/79+ KAPANDI (paketi 25-36, oturum
  30+31, hit count 0).

Yeni paketler için tetik: yeni boilerplate pattern keşfedilirse
`scripts/find-jenerik-scaffold.ts`'e ekle, audit re-run, top N seç,
paketi N script'i (paketi 36 referans) yaz. Pattern hazır.

### SEO landing batch 5+ (top 29 → top 36+, 12 kalan sayfa)

Adaylar: vietnam (29), brezilya (15), küba (12), peru (15), rus
(24), macar (12), iskandinav (18), ingiliz (40+), polonya (16),
avustralya (cuisine'lar). diet/sutsuz, diet/alkolsuz (diet'lar).
Pattern script `scripts/seo-revise-batch4.mjs`.

### P1 SEO landing intro derinlik (oturum 27 itibariyle top 29/41 done)

Top 5 (oturum 25): aperatifler, corbalar, turk, vegan, glutensiz.
Top 12 (oturum 26 batch 2): + tatlilar, kahvaltiliklar, tavuk-yemekleri,
et-yemekleri, hamur-isleri, italyan, vejetaryen.
Top 20 (oturum 27 batch 3, commit `b39b4df`): + salatalar, baklagil-
yemekleri, makarna-pilav, atistirmaliklar, sebze-yemekleri, fransiz,
japon, portekiz.
**Top 29** (oturum 27 batch 4, commit `36fff69`): + ispanyol (81),
yunan (45), cin (53), kore (44), tay (46), hint (47), meksika (61),
smoothie-shake (64 YENI), soslar-dippler (59 YENI).

**Kalan 12+ sayfa** batch 5-6 ile devam. Pattern: 150-250 kelime,
somut sayı + UNESCO/FAO/Escoffier/ATK otorite + pratik öngörü.
Pattern script `scripts/seo-revise-batch4.mjs`.

Sıradaki batch 5 (5-7 sayfa) adayları: kahveler-ve-cay, kokteyller,
icecekler, pideler-ve-lahmacunlar, kahve-sicak-icecekler (kategoriler);
vietnam (29), brezilya (15), küba (12), peru (15), rus (24), macar (12),
iskandinav (18), ingiliz (40+), polonya, avustralya (cuisine'lar).
diet/sutsuz, diet/alkolsuz (diet'lar). Multi-session, oturum 28-30+
tamamlanır.

### Mod K v2 (Tarif Kontrol, oturum 27 SONU itibariyle 51/71 sub-batch done = %71.8)

**Oturum 27 progress (toplam 31 batch apply, ~1550 entry)**:

Pak 1 (11a-18b, 16 batch, commit `49f4545`): 283 net yeni prod
correction. PASS ortalama %44.

Pak 2 (19a-21b, 6 batch, commit `22eb807`): 113 net yeni prod
correction + 0 onayli MAJOR (hepsi mini-rev'e). PASS ortalama %34.

Pak 3 (22a + 23a, 2 batch, commit `6e67b9f`): 71 net yeni prod
correction (22a 36 + 23a 35). 22b BAD reject (4 BLOCKED format
ihlali Kural 9 + Kural 1).

Pak 4 (23b + 24a, 2 batch, commit `2f9b770`): 60 net yeni prod
correction (23b 31 + 24a 29).

Pak 5 (25a, 1 batch, commit `6a8d445`): 38 net yeni prod correction.
24b BAD reject (12 BLOCKED Kural 9 + Kural 1).

Pak 6 (25b + 26a + 26b, 3 batch, commit `c1bf27f`): 88 net yeni
prod correction. 26a 18 MAJOR yöre yoğun batch.

Pak 7 (27a, 1 batch, commit `0cbb715`): 35 net yeni prod correction.

Toplam Mod K v2 prod correction (oturum 27): ~480 → **~1130** (+650
yeni). Mod K v2 progress 51/71 sub-batch (%71.8). Nutrition anomaly
1181 → ~1250 (Kural 10 etkisi, sonraki oturum compute-recipe-
nutrition.ts ile düzeltilecek).

**Codex queue (oturum 27 sonu)**:
- Disk'te hazır: `docs/mod-k-batch-27b.json` + `docs/mod-k-batch-
  28a.json` (sonraki oturum verify+apply pipeline)
- 22b + 24b BAD batch'ler Codex'ten yeniden istenecek (Brief
  sec.20.3 Kural 1 sisirme yasak + Kural 9 sure tutarliligi disiplini
  hatırlatma)
- 28b → 36b kalan ~17 sub-batch Codex tetiki gerek

**CUISINE_CODES `pt` (Portekiz) eklendi ✅** (oturum 27, commit
`43844f0`, 36 → 37 cuisine). 7 map + 8 SLUG_PATTERNS + 6 TEXT_KEYWORDS
+ 3 yeni test + scripts/fix-portekiz-cuisine.ts ile 2 tarif dev+prod
'es' → 'pt' update. Mini-rev kuyruğu 46 → 44 (lisbon-nohutlu-morina
+ lizbon-portakalli-badem-keki otomatik fix).

**Mini-rev kuyruğu 39** (oturum 27 sonu, paketi 1+2+3+4+5+6+7 ile
**45 mini-rev kapandı**, plus 25b/26a/26b/27a yeni MAJOR'lar
eklendi). Kalanın yapısı: 25a kalan 4 + 25b/26b/27a yeni 8 + 26a
kalan 11 + diğer dağınık 16. Sonraki paketlere dağılır.

25a yeni 6 (oturum 27 dördüncü paket sonrası, paketi 5'te 2 tarif kapandı, kalan 4):
- `passionfruit-pisco-spritz-peru-usulu`: Pisco yerine brendi + KOKTEYL/ICECEK type karışıklık
- `patates-rosti-lokmalari`: Rösti İsviçre kökenli, cuisine se yanlış (İsviçre kodu yok)
- ~~`patatesli-kete-tavasi-ardahan-usulu`~~: ✅ REWRITE (kete kuşağı patatesli varyant, paketi 5)
- `patatesli-soganli-midye-tava-istanbul-bogaz-usulu`: Midye tava klasik unlu kızartma, patatesli farklı
- ~~`patila-kars-usulu`~~: ✅ REWRITE description (Doğu Anadolu disambiguate + içli varyant, paketi 5)
- `patlican-pacarasi-manisa-usulu`: Manisa paçarası kaynaksız + step tekrar + közleme süre tutarsız

25b/26a/26b yeni 23 MAJOR (oturum 27 5. paket sonrası, sonraki paketlere):
- 25b (1): inceleme bekliyor
- 26a (18): yöre yoğun batch, çoğu yöresel atıf belirsiz
- 26b (4): inceleme bekliyor



22a (1, paketi 5'te kapandı): ✅ HEPSI KAPANDI
- ~~`mincili-laz-boregi-rize-ev-usulu`~~: ✅ REWRITE description (klasik tatlı disambiguate, tuzlu varyant kalır, paketi 5)

23b/24a yeni 5 (oturum 27 üçüncü paket sonrası):
- `nigde-sogurmeli-yumurta` (23b): Niğde söğürmeli yumurta kaynaksız + scaffold + biber közleme süresi
- `nohutlu-firikli-semsek-gaziantep-usulu` (23b): Sembusek Mardin etli kapalı, Gaziantep nohutlu firikli yok + vegan-yumurta çakışma
- `nohutlu-otlu-borek-aydin-usulu` (23b): Aydın atfı kaynaksız + scaffold + ot belirsiz
- `otlu-kete-dilimi-kars-usulu` (24a): Kars ketesi kavrulmuş unlu iç klasik, mevcut otlu hamur işi farklı kimlik
- `otlu-lorlu-kete-artvin-usulu` (24a): Artvin kaynaksız + tava/fırın kete karıştırılmış



~~Önceki 4 (oturum 26 sonu, mini-rev paketi 1 ile çözüldü, commit `7db92af`)~~:
- ~~`erzsebet-sour-macar-usulu`~~: ✅ DELETE (Codex halüsinasyonu, klasik kokteyl yok)
- ~~`feijao-tropeiro-brezilya-usulu`~~: ✅ REWRITE (klasik etli, bacon + linguica + couve)
- ~~`feslegenli-tavuklu-pirinc-tayland-usulu`~~: ✅ REWRITE (Pad Kra Pao Gai stir-fry)
- ~~`findikli-keskek-toplari-ordu-usulu`~~: ✅ DELETE (Codex halüsinasyonu + scaffold)

Yeni 26 (oturum 27, 11a-18b MAJOR identity/structural mismatch):

11a-12a:
- `fistikli-domates-corbasi-edirne-bag-usulu`: Edirne yöresel iddia kaynaksız
- `gul-sirkeli-tavuk-isparta-usulu`: Isparta yöresel iddia kaynaksız

13b (5, paketi 2'de 1 + paketi 3'te 2 + paketi 5'te 2 tarif kapandı, kalan 0): ✅ HEPSI KAPANDI
- ~~`hatay-zahterli-nohut-durumu`~~: ✅ REWRITE description (Gaziantep coğrafi işaret disambiguate, paketi 5)
- ~~`hatay-zahterli-tepsi-koftesi`~~: ✅ DESC_ONLY + minor (Antakya kofte uyumlu, paketi 3)
- ~~`helise-malatya-usulu`~~: ✅ REWRITE (Bitlis/Van menşeli, paketi 2)
- ~~`helle-tatlisi-tokat-usulu`~~: ✅ REWRITE (TATLI→CORBA un çorbası, paketi 3)
- ~~`hurmali-ekmek-tatlisi-kirklareli-usulu`~~: ✅ REWRITE description (Trakya jenerik, paketi 5)

14a-14b (4, paketi 3'te 3 + paketi 5'te 1 tarif kapandı, kalan 0): ✅ HEPSI KAPANDI
- ~~`icli-tava-sinop-usulu`~~: ✅ REWRITE (pirinçli iç harç + yumurta kapama, paketi 5)
- ~~`jeyuk-bokkeum`~~: ✅ REWRITE (TR pazar dana uyarlaması, paketi 3)
- ~~`jokai-bableves`~~: ✅ REWRITE (sucuk uyarlaması + ekşi krema + csipetke, paketi 3)
- ~~`kabak-bastisi-gaziantep-usulu`~~: ✅ REWRITE (TATLI→YEMEK etli klasik, paketi 3)

16a-16b (6, paketi 2'de 2 + paketi 3'te 1 + paketi 4'te 2 + paketi 5'te 1 tarif kapandı, kalan 0): ✅ HEPSI KAPANDI
- ~~`kastamonu-eksili-siyez-pilavi`~~: ✅ REWRITE (İhsangazi yoğurt+ebegümeci klasik, paketi 5)
- ~~`katikli-ekmek-kilis-usulu`~~: ✅ REWRITE (Hatay/Antakya kanonik, zahter ekle, paketi 4)
- ~~`kayisava-trabzon-usulu`~~: ✅ DELETE (Codex halüsinasyonu, paketi 4)
- ~~`kayisili-irmik-pilavi-macaristan-usulu`~~: ✅ REWRITE (YEMEK→TATLI tejbegríz, paketi 3)
- ~~`kayseri-kursun-asi`~~: ✅ REWRITE (bulgur+kıyma köfte klasik, paketi 2, KRİTİK fix)
- ~~`kayseri-yag-mantisi`~~: ✅ REWRITE (mayalı bohça kızartma, paketi 2)

17a (7, paketi 2'de 2 + paketi 4'te 5 tarif kapandı, kalan 0): ✅ HEPSI KAPANDI
- ~~`kelecos-erzurum-usulu`~~: ✅ REWRITE (kurut+kavurma klasik, paketi 2)
- ~~`kelecos-van-usulu`~~: ✅ REWRITE (bakliyat+et+pazı keledoş, paketi 2)
- ~~`kerebic-kup-mersin-usulu`~~: ✅ REWRITE (çöven köpük + içli kurabiye klasiği, paketi 4)
- ~~`keskekli-istavrit-tava-sinop-liman-usulu`~~: ✅ DELETE (Codex halüsinasyonu, paketi 4)
- ~~`kestaneli-hamsi-pilavi-zonguldak-usulu`~~: ✅ DELETE (Codex halüsinasyonu, paketi 4)
- ~~`kibe-mumbar`~~: ✅ REWRITE (KRİTİK data corruption fix, paketi 4)
- ~~`kilis-oruk`~~: ✅ REWRITE (şiş kebap klasik, paketi 4)

17b (2): ~~ikisi de paketi 2'de kapandı (REWRITE)~~
- ~~`kiraz-yaprakli-kofte-malatya-usulu`~~: ✅ REWRITE (yoğurt+yumurta sos klasik, paketi 2)
- ~~`kiraz-yaprakli-sarma-malatya-usulu`~~: ✅ REWRITE (bulgur+yarma+yoğurt sos, paketi 2)

19a-21b yeni 16 (oturum 27 ikinci paket):

19a (2):
- `lechon-asado`: Küba klasik DOMUZ etiyle, mevcut dana döş (jeyuk-bokkeum pattern)
- `leka-ispanakli-krep-isvec-usulu`: 'Leka' İsveç adı kaynaksız, ıspanaklı krep genel

19b (1, lisbon/lizbon pt fix oldu):
- `lime-kabuklu-irmik-kup-peru-usulu`: Peru atfı kaynaksız, Türk irmik tatlısı
- ~~`lisbon-nohutlu-morina-salatasi`~~: ✅ pt fix (commit `43844f0`)
- ~~`lizbon-portakalli-badem-keki`~~: ✅ pt fix (commit `43844f0`)

20a (6, en yoğun):
- `lorlu-biber-dolmasi-tekirdag-usulu`: Tekirdağ atfı kaynaksız
- `lorlu-biberli-sembusek-mardin-usulu`: Mardin lorlu biberli varyant doğrulanamadı
- `lorlu-enginar-boregi-urla-usulu`: Urla atfı + scaffold steps
- `lorlu-firik-dolma-izmir-bostan-usulu`: Firik Güneydoğu, İzmir bostan iddiası kaynaksız
- `lorlu-kabak-cicegi-tostu-izmir-usulu`: İzmir tost iddiası kaynaksız + scaffold
- `macar-visneli-tarhonya-pilavi`: Tarhonya doğru, vişneli Macar varyant kaynaksız

20b (3):
- `mahlepli-yesil-mercimek-corbasi-tokat-bag-usulu`: Tokat+mahlep iddia kaynaksız + Codex 4 ingredient_remove geniş scope
- `manisa-kula-guveci`: Resmi kuzu+domates+biber+tereyağı, mevcut patlıcan+soğan+sarımsak+zeytinyağı (yapı revize)
- `manisa-kulah-kapamasi`: Külah kapaması yok, Alaşehir kapaması ile karıştırılmış

21b (2):
- `menekse-serbeti-erzurum-usulu`: Erzurum atfı kaynaksız + step şeker ingredient yok + Kural 9 dinlendirme
- `mesir-baharatli-tavuk-manisa-usulu`: Mesir baharatlı tavuk yöresel klasik değil + ingredient mesir yok + Kural 9

Pattern: Web research agent + 2-3 kaynak/tarif teyit + manuel update
script + AuditLog `MOD_K_MANUAL_REV`. Her biri ~15-20 dk. Sonraki
oturumlara dağılır (4 mevcut + 26 11a-18b + 16 19a-21b = **46 toplam**,
~12-15 saat iş, 4-6 oturuma yayılır).

### Test Campaign K8 + kalan polish (~3 saat toplam, opsiyonel)

**K8 cross-browser + PWA** (kullanıcı telefondan):
- iOS Safari TTS Web Speech API + reduced-motion
- Firefox audio + animation
- Edge gerçek cihaz
- PWA install banner + standalone mode
- 6 viewport (320/375/768/1024/1440/1920)

**Test Campaign kalan P2 (3 madde, launch sonrası)**:
- Newsletter input feedback inline timing detail
- Servings adjuster ± 32×32 mobile (K6 P3 #6)
- Action button mobile py-3 sweep'in başka yerlerinde

**Test Campaign kalan P3 (5 madde, marjinal)**:
- Profil 0-stat başka user (privacy controls var, default "show")
- RSS atom:link type marjinal
- Search query log monitoring

**Mini-rev 7 tarif TAMAM ✅** (3 BLOCKED oturum 25 + 4 MAJOR oturum
26): Manuel düzeltme + 2 web research agent + 2-3 kaynak/tarif teyit.
2 PASS (ankara-tava + anzac-biscuits) + 5 CORRECTION (cevizli-narli-
kofte-siirt-usulu + denizli-yen-boregi + dereotlu-patates-rosti-isvec-
usulu + domatesli-firik-pilavi-tekirdag-usulu + eggs-benedict).
dark-and-stormy skip kalıcı (Bermuda enum yok, 1 tarif için
mantıksız). Tüm 7 dev + prod apply 7/7 PASS, AuditLog action=
"MOD_K_MANUAL_REV".

**Aşağıdaki eski oturum 25 başlığı kaldı (referans):**

### Mod K v2 (eski, oturum 25 itibariyle 12/71 sub-batch done = %16.9)

**Durum**: 12 sub-batch v2 tam pipeline (1a + 1b + 2a + 2b + 3a + 3b
+ 4a + 4b + 5a + 5b + 6a + 6b = ~321 yeni correction prod oturum 25).
59 sub-batch kalan (7a-36b). Brief §20.3 Kural 9/10/11 (süre
tutarlılığı + nutrition ingredient-aware + step-ingredient miktar)
+ §20.7 yeniden audit (1a'dan tekrar, idempotent guarantee). Eski
1a-4b v1 outputs `docs/mod-k-archive-pre-rule17/` arşivinde.

**Codex tetik (kullanıcı)**: tek satır `Mod K. Batch Nx.` (CODEX_NEW_
CHAT_INTRO Bölüm 6). Codex 2-3 saat web research, output `docs/mod-
k-batch-Nx.json` diske yazılır. Claude verify+apply pipeline (--batch
+ --apply + --apply-major + --slugs cherry-pick + --env prod
--confirm-prod).

**PASS oran trend (12 batch, oturum 25)**: 1a 66 → 1b 52 → 2a 40 →
2b 42 → 3a 46 → 3b 42 → 4a 60 → 4b 58 → 5a 50 → 5b 34 → 6a 48 →
6b 36 (ortalama %48). Codex Kural 9/10/11 sıkı disiplin oturmuş;
düşük PASS = yüksek CORRECTION = kaliteli audit (yumuşak değil sıkı
düzeltme).

**3 BLOCKED reject (oturum 25)**: ankara-tava-eristeli-kuzu (tek-
domain source), anzac-biscuits (Kural 9 süre %67), cevizli-narli-
kofte-siirt-usulu (Kural 9 süre %73). Mini-rev Codex'ten istenecek.

### CUISINE_CODES TAMAM ✅ (30 → 36, oturum 25)

Mod K v2 cuisine gap'leri kapatıldı: tn (Tunus, brik), ar (Arjantin,
provoleta + chimichurri), co (Kolombiya, arepa + arequipe-flan),
ve (Venezuela, arepa), dk (Danimarka, aebleskiver), za (Güney Afrika,
cape-town-bobotie). 7 map + TEXT_KEYWORDS + verify VALID_CUISINES +
tests + i18n + 6 yeni /mutfak/[slug] landing prod canlı 200.

Manuel cuisine fix DB updates: cape-town-bobotie 'gb' → 'za'
(scripts/fix-cape-town-bobotie-cuisine.ts). Adana Kebap marine fix
prep 90 → 30 (scripts/fix-adana-kebap-marine.ts).

Sıradaki cuisine genişlemesi: Codex sonraki batch'lerde benzer gap
çıkarsa (örn. ph Filipinler, ng zaten var, no Norveç ayrı) eklenebilir.

### Polish phase TAMAMLANDI ✅ (oturum 23 sonu)

Bu paketlerin hepsi yapıldı:

1. ~~**Tarif zaman çizelgesi (timeline visual)**~~ ✅ oturum 23
   - `RecipeTimeline.tsx` + `lib/recipe/timeline.ts` + 12 unit test
   - Sauerbraten 3 gün marine demo prod
2. ~~**Pişirdim ✓ rozet sistemi**~~ ✅ oturum 23
   - RecipeCooked schema + toggle + count + profil tab + RecipeCard
     badge + "Bu hafta en çok pişirilenler" anasayfa shelf
3. ~~**Newsletter haftalık scheduled send**~~ ✅ önceki oturumlar
   (audit oturum 23'te: zaten %100 aktif, vercel.json cron + Resend
   template + test mail OK)
4. ~~**Recipe step image upload altyapı**~~ ❌ İPTAL (oturum 23)
   Kerem feedback: "Her adıma fotoğraf zorlaması karışıklık".
5. ~~**Quality dashboard top 10 manuel rafine**~~ ✅ oturum 23
   (Allergen calibration + Americano polish ile top 10 score 35-49 →
   minimum 5 seviyesine düştü)

### Sıradaki büyük paketler (öneri, oturum 25+ için)

1. **Mod K Batch 4b-36b devam** (Codex iş, ~65 sub-batch)
   - Sen tetikler (1 satır), ben verify+apply pipeline
   - Beklenen: 200-500 ek correction + 30-100 MAJOR_ISSUE
   - 350/3517 → 3517/3517 = %100 tarif kontrol hedef

2. **Mod M Batch 2-3-4 devam** (Codex iş, 3 batch)
   - 117 marine adayı kaldı (51-167)
   - Batch 1 yeniden apply'da Codex disiplini öğrendi (TR karakter +
     redundancy fix), sonraki batch'ler doğrudan kalite

3. **Mod A 40+: yeni tarif yazma** (Codex iş, 2-3 batch)
   - 3517 → 3600+ hedef, Codex 50-100 yeni tarif
   - Brief Kural 6/7/16 disiplinli
   - Önerilen marine'li tarifler: ekşi maya ekmek, sushi pirinç,
     tandoori tavuk, ceviche, kore bulgogi (RecipeTimeline 3 segment)

4. **Çeşitleri yazılarına table format** (~45 dk, Claude iş)
   - peynir/makarna/sirke/tuz/un/domates/zeytin yazıları (~7-8)
   - remark-gfm aktif, liste formatları table'a çevrilebilir
   - Görsel zenginleştirme + okuma kalitesi
   - Quick wins, kategori dengesi nötr

5. **Yeni blog yazıları** (kategori dengesi)
   - pisirme-teknikleri (15): Sos Kalınlaştırma Yöntemleri (Çorba
     Bilimi devam), Kızartma Yağı Yönetimi, Düdüklü Tencere
   - malzeme-tanima (16): Acı Sos Yapımı, Yumurta Tazeliği var,
     Kuruyemiş Çeşitleri
   - mutfak-rehberi (18): meal prep, kış sebzeleri, ev turşusu

### Mod FA pipeline TAMAM (oturum 20)

Tüm 4 batch revize prod'da (12r + 13r + 14r + 15r v2), 400 tarif scaffold
cleanup. Pipeline 4/4 KAPANIŞ. Brief §16.2 Kural 5 (tatlı scaffold yasağı)
oturum 20'de eklendi (15r v1 reject sonrası ders).

### Codex Mod F PIPELINE KAPANIŞ ✅ (oturum 21)

**Mod F 27/27 prod canlı.** Tüm batch'ler apply edildi (07-21 + 22r +
23 + 24 + 25 + 26 + 27), toplam **2660 tarif step retrofit**. 26: 100
YEMEK 605 step / 27: 60 YEMEK 344 step (final, küçük batch). Audit-deep
PASS (her ikisi), smoke sivas-hingel + thit-kho 200 OK. Mod F retrofit
pipeline TAMAM.

Codex tetik formatı (sırayla): `Mod F. Retrofit-24` → JSON gelince
`scripts/apply-retrofit.ts --file docs/retrofit-step-count-NN.json`
ile dry-run + dev apply + audit-deep + prod apply.

### Beta etiketi 4 preset'ten kaldırma (launch sonrası 1-2 hafta izleme)

Faz 2'nin 4 preset'i (yuksek-lif/dusuk-sodyum/akdeniz/keto-hassas) Beta
korur cunku proxy fallback'i yok, eslesmesi yetersiz tariflerde skor
sikintili. Coverage %92 (top 130 ingredient), launch sonrası 1-2 hafta
gözlem ile yanlış skor şikayet yoksa Beta düşürülür. Düşük şeker zaten
stable (carbs proxy fallback + %86 USDA).

scorer.ts içinde `isBeta = profile.requiresEnrichedData && profile.slug !== "dusuk-seker"` mantığı; 4 preset için override eklenebilir veya
requiresEnrichedData=false yapılabilir.

### Uzun-kuyruk ingredient seed (Faz 4, opsiyonel, launch sonrası)

Oturum 21'de batch 4 (top 80) + batch 5 (top 101) seedlendi, **311
ingredient** prod, coverage **%92 → %99.97** (3470/3471 tarif
matchedRatio>=0.5, 0-match 1). Plus TR-aware fold root cause fix
(`aggregate.ts` + `audit-top-ingredients.ts`).

Geriye kalan ~1075 unmatched ingredient'in çoğu 1-5x freq, uzun-kuyruk.
Tek bir tarifte iki kez geçen marjinal malzeme. Ek seed gain marjinal,
launch sonrası kullanıcı şikayetine göre devam edilir. audit-top-
ingredients.ts ile gerçek gap görülebilir.

<!-- Vercel env DATABASE_URL_OLD kontrol ✅ YOK (oturum 21'de doğrulandı)
     Eski standalone Neon kalıntısı Vercel env'de yok, mevcut DATABASE_URL
     Vercel-managed Neon (ep-icy-mountain). Cleanup TAMAM. -->

<!-- Neon password rotate ✅ GEREKSIZ (oturum 21'de netleşti)
     Vercel-managed Neon connection string'i Vercel otomatik yönetiyor;
     manuel password rotation gerekmiyor. Eski standalone Neon (manuel
     password'lu) zaten silindi. -->





### Legal + KVKK detay polish (launch öncesi, opsiyonel, 15-30 dk)

Oturum 19 G paketi audit'i: Kerem KVKK/Gizlilik/Kullanım Koşulları/Çerez
Politikası/Güvenlik/İletişim 6 sayfayı detaylı yazmış, 6698 referansı,
veri sorumlusu, hukuki sebepler, işleme amaçları net.

Minor polish noktaları (launch-blocker değil, Kerem kararı):

1. **Veri sorumlusu kurumsal kimlik**: şu an "Tarifle platformu" + Kerem
   iletişim email. Launch formalite için "Tarifle - [Kerem Öztürk,
   Şahsi]" veya "Tarifle - [LTD ŞTİ adı]" ünvan eklenebilir. KVKK
   uyumu zaten var, bu sadece görünüm.

2. **lastUpdate tarihi**: 19 Nisan 2026 (6 gün eski). Bu oturumda CSP
   Report-Only + X-Frame-Options + delete flow eklendi; bunlar gizlilik/
   güvenlik yazılarına yansımadı. Minor: "Güvenlik" sayfasına "Content-
   Security-Policy Report-Only mode aktif", "X-Frame-Options DENY"
   satırları eklenebilir. Ve lastUpdate → 25 Nisan 2026.

3. **İletişim email kurumsal**: koz.devs@gmail.com kişisel. Launch için
   kvkk@tarifle.app + iletisim@tarifle.app alias'ları Resend/Cloudflare
   Email Routing ile Kerem'in inbox'ına forward edilebilir. Güven sinyali.

### Blog inline paragraf-içi link bonus (opsiyonel polish)

Oturum 21'de tüm 41 blog yazısına "## İlgili Yazılar" mini-bölümü
(yazı sonu, Kaynaklar öncesi) eklendi: editorial seçim, her yazıya 3
ilgili link, toplam 123 yeni internal link. SEO on-page authority +
reader journey ✅. `scripts/insert-blog-related.mjs` map'i kayıtlı,
yeni blog 42+ eklenince map'e bir entry yeterli.

Bonus polish (opsiyonel, launch öncesi yapılmaz, sonrası yapılabilir):
kritik bağlamlarda paragraf-içi inline link de ekle (sadece 5-10
yazıda en güçlü bağ noktasına, örnek: et-mühürleme yazısının "iç
sıcaklık" paragrafında soğuk-zincir yazısına inline anchor). Section
linki zaten kapsayıcı, inline ek SEO ve reader katkısı marjinal.

### DMARC kaydı ekle (launch öncesi, 5 dk DNS işi)

Oturum 19 cron + observability audit'inde tespit edildi: `_dmarc.tarifle.app`
TXT kaydı YOK (NXDOMAIN). Modern Gmail/Outlook DMARC olmayan domain'lerin
email'ini agresif filter'lar, inbox yerine spam veya direkt reject.

**Ship edilmiş tarafı**:
- Resend DKIM: `resend._domainkey.tarifle.app` p= public key ✅
- Resend SPF: `send.tarifle.app` TXT `v=spf1 include:amazonses.com ~all` ✅
- Resend bounce MX: `send.tarifle.app` 10 feedback-smtp.eu-west-1.amazonses.com ✅

**Eksik**: DMARC policy. Cloudflare DNS panel üzerinden eklenmeli (Kerem):

```
Host:  _dmarc
Type:  TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@tarifle.app; fo=1
TTL:   3600
```

`p=none` başlangıçta (monitor mode, mail bloklamaz sadece rapor alır).
1 ay izleme sonrası `p=quarantine`, 3 ay sonra `p=reject` geçişi.
rua@ adresine haftada 1-2 rapor gelir, deliverability doğrulama için.

Opsiyonel: `p=none` DMARC çoğu durumda launch için yeterli.

### E. Onboarding polish kalanlar (launch sonrası opsiyonel)

Oturum 19 E paketi büyük ölçüde ship edildi:
- **Welcome email** register sonrası fire-and-forget (Dolap + AI Asistan +
  Favoriler/Koleksiyon 3 feature + blog referansı) ✅
- **Profil eksik tamamla banner** (home sayfasında login + bio/avatar NULL
  ise dismissable prompt) ✅

Kalan opsiyonel polish'ler:

1. **İlk giriş guided tour** (30-45 dk): User.tourCompletedAt kolonu
   eklenip 3-4 step'li floating overlay tour (Dolap'a git → Favorilere
   kaydet → AI Asistan'ı dene). Skip edilebilir, custom lightweight.

2. **Empty state CTA polish** (20 dk): /dolap boş → "İlk malzemeni ekle"
   büyük CTA + örnek 5 malzeme öneri. /favoriler boş → "İlk tarifini
   bookmark et" + popüler 3 tarif carousel. /koleksiyon boş → template
   öneri (hafta sonu / çocuk dostu).

3. **DE locale tam ship** (~4-5 saat, launch sonrası):
   `LOCALES = ["tr", "en"]` aktif, "de" yok. Welcome email DE eklemek
   için sadece email key'leri yetmez; tüm `messages/de.json` (2400+
   key TR'den çevrilmiş hali) + `LOCALES` güncellemesi + middleware
   + `LOCALE_LABELS` gerek. Recipe.translations'da DE içerik zaten
   var (oturum 6+ Mod B eklemesi), sadece UI metinleri eksik. Codex
   Mod B benzeri ile messages/de.json full çeviri batch'i.
   Launch öncesi gereksiz scope, oturum 22'de skip.




### CSP ENFORCE CANLI ✅ (oturum 21)

Sentry'de 14 gün 0 violation izleme sonrası enforce'a geçildi. Header
artık `Content-Security-Policy` (Report-Only kaldırıldı). Whitelist
disinda script/stil/img/font BLOKLANIR. Report-uri aktif: bloklamadan
once Sentry'ye violation forward edilir. Geri dönüs için tek satir:
header key reverse.

**Sonraki 1 hafta izlem**: yeni özellik / 3rd party script eklenince
beklenmedik violation Sentry alert ile yakalanır, hızlı whitelist
extend.

### CSP Report-Only ESKİ NOT (oturum 19'da ship edildi, oturum 21'de enforce)

Oturum 19'da ship edildi:
- `Content-Security-Policy-Report-Only` header aktif (next.config.ts)
- `/api/csp-report` endpoint Sentry'ye violation forward
- Rate limit scope `csp-report`: 60/dk per IP
- İlk whitelist: Vercel Analytics + Sentry + Cloudinary + Google Fonts + Google OAuth avatar

Siteyi kırmaz (Report-Only), sadece rapor eder. Sonraki adımlar:

1. **1-2 hafta izle**: Sentry'de "csp-violation" etiketli issues toplansın
2. Analiz: hangi directive en çok blok ediyor, whitelist eksik mi, 3rd party'ler değişti mi
3. Gerçek blocked_uri'leri policy'ye ekle (örn. yeni CDN, yeni font provider)
4. **Enforce geçiş**: header name `Content-Security-Policy-Report-Only` → `Content-Security-Policy`, Report-Only kaldır
5. `'unsafe-inline'` + `'unsafe-eval'` son aşamada nonce-based'e taşınmalı (Next.js 16 nonce pattern, ayrı iş paketi)

İzleme süresince Sentry filter: `tag:csp.directive:*`.


### NPM audit 13 moderate vulnerability (postcss + uuid transient)

`npm audit`: 0 critical / 0 high, 13 moderate. Kök: `next@>=9.3.4` transient postcss
+ `svix → uuid`. Breaking fix: `next@9.3.3` (major downgrade) veya `resend@6.1.3`.
Launch öncesi yapılmaz. Sonraki Next major upgrade'te otomatik düzelir muhtemelen.

Monitor: her ay `npm audit` çalıştır, yeni critical/high çıkarsa derhal incelemek.





### Mod F Retrofit Step Count (oturum 18 devam, 6/27 bitti)

Retrofit pipeline A+ standardında stabil çalışıyor. Brief §15 self-check
5 gate (varyasyon / notes / timer / muğlak / kritik nokta %60) Retrofit-03+
için geçerli. Son 4 batch (03-06) her biri kritik nokta gate'i geçti.

**Tamamlanan (600 tarif retrofit, dev + prod)**:
- [x] Retrofit-01 100 APERATIF B+ (baseline, brief A+ öncesi)
- [x] Retrofit-02 100 APERATIF+ATISTIRMALIK A- (varyasyon + notes PASS,
      kritik nokta %10 gap'i brief §15.7.4 gate'ine dönüştü)
- [x] Retrofit-03 100 CORBA A+ (kritik nokta %65, ilk TAM A+)
- [x] Retrofit-04 100 CORBA A (3 kelime minor)
- [x] Retrofit-05 100 CORBA A- (15 kelime servis step'leri)
- [x] Retrofit-06 100 CORBA+KAHVALTI+ICECEK 🏆 A+ 0 sorun (kelime 0 ihlal,
      Codex kural disiplini tam)

**Kalan**: 21 batch, 2060 tarif. Tip dağılımı şu an kalan CSV'ler:
- `docs/retrofit-step-count-07.csv` .. `27.csv`
- KAHVALTI devam (~339), TATLI 449, SALATA 256, KOKTEYL 97,
  ATISTIRMALIK 70, YEMEK 919 (son dalga)

Codex'e tek tek tetik: `"Mod F. Retrofit-07"`, JSON gelince
`scripts/apply-retrofit.ts --batch 7 --apply` + prod.


### Mod A Batch 39b+ (launch hedef AŞILDI ✅, katalog 3714)

Mod A Batch 37a + 37b + 38a + 38b + 39a prod canlı (oturum 21,
~245 yeni tarif). **Prod 3471 → 3714 tarif** net (+243, amlou/aam
panna sil dahil). 39a: 50 TR/uluslararası dengeli, kategori
YEMEK 25 + CORBA 7 + TATLI 9 + KAHVALTI 3 + ATISTIRMALIK 2 + APERATIF
1 + SOS 2 + SALATA 1, isFeatured 5, kalori 135-680. Recompute pipeline:
hunger-bar 50 row + nutrition 3714 row + diet-score **37140 row**
(3714 x 10 preset).

Sonraki Mod A batch (opsiyonel): 39b tetiklenebilir. Brief §5.0
Kural 6 + 7 (oturum 21'de eklendi, step-ingredient + alkol tag drift
önleme) ZORUNLU.

### Neon → Vercel Marketplace migration cleanup (TAMAM, oturum 20)

Oturum 15'te standalone Neon (ep-broad-pond + ep-dry-bread) Vercel-managed
Neon'a (ep-icy-mountain + ep-jolly-haze) taşındı. Oturum 20'de cleanup
tamamlandı (5 günlük stabilite kanıtı sonrası, finansal aciliyet yoktu
çünkü Vercel Pro DB credits yeni branch'leri karşılıyor):

- [x] Eski Neon `tarifle` project (curly-hill-43162204) silindi
      console.neon.tech "Kerem's projects" org boş kaldı
- [x] `scripts/lib/db-env.ts` PROD_HOST_PREFIXES + DEV_HOST_PREFIXES
      eski prefix'ler kaldırıldı (`ep-broad-pond`, `ep-dry-bread`)
- [x] Lokal backup dosyaları silindi (`.env.*.bak-oturum15-neon-migration`)
- [x] `scripts/tmp-migration/` dizini silindi
- [ ] Vercel env `DATABASE_URL_OLD` (varsa, Kerem dashboard'tan kontrol)
- [ ] Yeni project password rotate (opsiyonel hijyen, dump sırasında
      chat'e password yapıştırıldıysa rotate)

### Hero A/B test DURDURULDU (oturum 15)

Oturum 13'te kurulu A/B ("Bugün ne pişirsek?" vs "Aklındaki malzemeyle
yeni bir şey") launch öncesi trafikte anlamlı data üretmeden Kerem'in
cookie'sinde B'ye yapışıp kaldı, eski klasik A hero'yu hiç göremedi.
Mekaniği `src/lib/experiments/hero-tagline.ts` + `HeroVariantInit`
korundu ama `pickVariant` her zaman A döner. Launch sonrası trafik
yakalandığında (1000+ DAU) tekrar aktifleştirilebilir:

- [ ] Launch sonrası A/B yeniden aç (pickVariant'ın random kısmını
      restore et, cookie sticky)
- [ ] Plausible/PostHog entegrasyonu (conversion attribution)
- [ ] 2 hafta sonra Sentry `hero.variant: A|B` filter + variant
      kazanan kararı, kaybedeni sil

### Vercel Fluid CPU 7-day teyit

- [ ] TTL artışı sonrası Dashboard Fluid Active CPU %50+ azalma gözlemi
- [ ] Oturum 12-13 TTL agresif artış + B1-B13 Mod E apply sonrası ek
      cache invalidation frequency etkisi

---

## 📋 Planlı (site açılışı öncesi, oturum 16-22)

### Teknik + kalite

- [ ] **AI v5 LLM katmanı** (launch sonrası, Pro tier):
      - Tarif uyarlama asistanı ("bu tarifi vegan yap" / "gluten-free
        yap" / "3 kişilik yap" → Claude Haiku ile re-write)
      - Serbest metin sorgu ("akşama karides ve havucumla ne yapsam?")
      - Fotoğraftan malzeme tanıma (Vision API)
- [ ] **Cache Components (PPR) full refactor** (oturum 12'de denendi,
      `cacheComponents: true` Tarifle'de 30+ `force-dynamic` export ile
      çakıştı, paradigm shift 8-12 saat). Site açılış sonrası dedicated
      sprint'te. Beklenen kazanç: Fluid Active CPU %40-50 azalma + perf
      score 73 → 90+.
- [ ] **Brief kelime sayı min 4'e gevşet** (oturum 18 Retrofit-05 dersi,
      "Karabiberle servis edin" 3 kelime anlamlı ama kural 5+ reject;
      yapay uzatma faydasız). §15.7 kuralı güncelleme 5 dk iş.

### İçerik

- [ ] **Mod A Batch 37a+**: launch hedef 3500+ (şu an 3452, 48 kısa).
      Brief §5 A+ standardı aktif.
- [ ] **Fotoğraf dalgası**: top 100 tarife Cloudinary'den görsel yükle
      (placeholder emoji değil, gerçek foto)

### Blog kategorisi genişletme

Oturum 21'de 41 → 46 yazı, ilk 5 aday (baharatli + soguk-sicak + ev
ekmek + damak dengesi + mikro otlar) ship edildi. Mevcut denge
yaklaşık: mutfak-rehberi 18 / pisirme-teknikleri 14 / malzeme-tanima
14. Yeni dalga için aday havuzu (her kategoriden dengeli ilerleme,
mevcut yazılarla overlap yok, evergreen + yüksek arama hacmi):

**malzeme-tanima (öncelik):**
- [ ] **Acı Sos Yapımı ve Çeşitleri** - fermente sos vs taze, kapsaisin
      sıkıştırma, ev yapımı sürekli kullanım sosu
- [x] ~~**Limon ve Limon Suyu Rehberi**~~ ✅ ship (oturum 21, blog 49)
- [x] ~~**Yağ Kimyası ve Duman Noktaları**~~ ✅ ship (oturum 21, blog 47)
- [ ] **Tahıl Çeşitleri Karşılaştırma** - bulgur/pirinç/karabuğday/
      kinoa/yulaf yan yana
- [ ] **Bal Türleri ve Mutfak Kullanımı** - çiçek/orman/karakovan/
      petek farkları, ısıya dayanıklılık
- [x] ~~**Sirke Çeşitleri**~~ ✅ ship (oturum 21, blog 50)
- [ ] **Yumurta Tazeliği ve Saklama** - su testi, tarih kontrolü, oda
      vs buzdolabı
- [ ] **Kuruyemiş Çeşitleri** - kavurma teknikleri, saklama, pişirmede
      kullanım

**pisirme-teknikleri:**
- [x] ~~**Sote vs Kavurma vs Buğulama**~~ ✅ ship (oturum 21, blog 48)
- [ ] **Salamura ve Marine Bilimi** - işlem süresi, malzeme oranı,
      yumuşatıcı etki
- [ ] **Kızartma Yağı Yönetimi** - sıcaklık kontrol, filtreleme, ne
      zaman değiştirilir
- [ ] **Düdüklü Tencere Kullanımı** - güvenlik, süre kalibrasyonu,
      hangi yemek
- [ ] **Çorba Bilimi: Tabandan Servise** - kemik suyu, sebze suyu,
      püre, terbiye
- [ ] **Sos Kalınlaştırma Yöntemleri** - un/nişasta/yumurta sarısı/
      krema/bağlayıcı redüksiyon
- [ ] **Ekmek Hamuru Yoğurma Teknikleri** - el / makine / katlama,
      glüten gelişimi (ev-yapimi-ekmek-tipleri yazısının pratik devamı)

**mutfak-rehberi:**
- [ ] **Yemek Saklama ve Donmuş Hazırlık (meal prep)** - bir günde
      hafta yemeği planı
- [ ] **Kış Sebzeleri Mutfağı** - lahana/karnabahar/pancar/karalahana
      sezon haritası
- [ ] **Ev Yapımı Turşu Çeşitleri** - lahana/salatalık/biber/karışık,
      tuz oranı, fermentasyon süresi
- [ ] **Çocuk Dostu Yemekler** - sebze gizleme, sunum, beslenme dengesi
- [ ] **Yaz Sıcağında Hafif Mutfak** - soğuk çorba/salata/no-cook
- [ ] **Misafir Sofrası Planlama** - mevsim + ana yemek + tatlı uyumu
- [ ] **Tek Kişilik Yemek Pişirme** - porsiyon ölçeği + saklama
- [ ] **Bütçe Mutfağı** - ucuz protein + dolgun yemek + atıksız mutfak

**Mevsimsel (zamana bağlı, tarih hassas):**
- [ ] **Ramazan Sahurunda Doyurucu Tabak** (Ramazan öncesi)
- [ ] **Kurban Etini Doğru Değerlendirmek** (Kurban Bayramı öncesi)
- [ ] **Yaz Sofrası: Pikinik ve Bahçe Yemekleri** (Mayıs-Haziran)

**Bonus (görsel + Cloudinary):**
- [ ] Et bölgeleri diyagramı (et-bolgeleri-rehberi yazısına ek görsel,
      Eren çizimi veya public domain)
- [ ] Mutfak ekipman ölçü diyagramı (mutfak-ekipman yazısına)

**Süreç notu:** Her oturum 1-2 yazı, kategori dengesini koru
(rehber/teknik/malzeme yaklaşık 1:1:1). Yeni yazı yazılırken
`scripts/insert-blog-related.mjs` map'e entry eklemek + visual
baseline güncellemek standart akış.

### A11y + UX polish

- [ ] **Color contrast** WCAG AA detaylı tarama (Lighthouse 100 ulaştı
      ama spot check eksik)
- [ ] **Dark mode polish**: varsa kontrol, yoksa karar

### SEO

- [ ] **Schema.org Video** (ileride Remotion snippet eklenince)
- [ ] **Google Search Console**: her kategori/mutfak/diyet için CTR
      izlem, düşük CTR'lı başlık revize
- [ ] **Blog yazıları SEO izlem**: 25 yazının indekslenme + CTR takibi,
      düşük performanslı başlık revize

---

## 🚀 Sonrası (site açılışı sonrası, oturum 22+)

### Topluluk seed (P2-12)

- [ ] 5-10 editör/aşçı daveti
- [ ] İlk hafta 2-3 uyarlama paylaşım planı
- [ ] "Uyarlamanı paylaş" kampanyası (rozet reward)
- [ ] Haftalık editör seçimi "topluluk_seçimi" skor bonusu

### Paid tier (Faz 2 - Pro)

- [ ] Stripe integration (TR TL kabul)
- [ ] Subscription state DB model (`UserSubscription`)
- [ ] Pro badge visual design
- [ ] Paywall UI (limit aşımında modal)
- [ ] Analytics: conversion funnel (free → trial → paid)
- [ ] İptal + iade akışı + KVKK data export

### Max tier (Faz 3)

- [ ] Max badge platin tasarım
- [ ] Editör 1-1 review mekanizması (calendar + video call)
- [ ] Video snippet upload (Remotion + Cloudinary)
- [ ] **Tarifle içerik üreticisi programı**: Top 50 all-time reklam
      geliri %30 pay. Ödeme altyapısı (Türkiye'de freelance ödeme yasal
      düzenleme).

### Growth

- [ ] Sosyal medya otomasyonu: Instagram Reels (Remotion), TikTok snippet,
      Pinterest pin jenerasyonu
- [ ] Newsletter haftalık scheduled send (Resend bağlı, test başarılı,
      scheduler kurulumu kalıyor)
- [ ] Influencer pilot (5 mikro-influencer, affiliate code)
- [ ] App Store / Play Store hazırlığı (PWA → TWA Android, Capacitor iOS)
- [ ] Referral programı (kullanıcı davet = 1 ay Pro free)

---

## 💡 Fikir havuzu (öncelikli değil, değerlendirilecek)

- Ses tanıma ile pişirme modu ("sıradaki adım", "tekrarla")
- Tarif tercümesi kullanıcı input ile (başka mutfak adaptasyonu)
- Besin değeri benim diyetime göre hedef skor (düşük-şeker, yüksek-lifli,
  vejeteryan dengeli)
- "Haftalık dolap taraması" quiz (kullanıcı 15 malzeme seçer, sistem
  haftalık menü önerir)
- Tarif "zorluk seviyesi kişiselleştirme" (yeni başlayan → orta →
  ileri, aynı tarif farklı detayla)
- Çoklu kullanıcı menü planlayıcı (aile üyeleri diyet kısıtı aggregate)
- Tarif karşılaştırma sayfası (`/karsilastir?a=slug1&b=slug2`)
- Recipe remix feature (otomatik vegan/glutensiz/hızlı versiyon)

---

## ✅ Oturum 18'de tamamlananlar (referans, detay PROJECT_STATUS.md)

**AI paketi 9 özellik A-I + voice pref (rule-based, sıfır LLM)**:
- A: Pişirdim → Pantry decrement (miktar döngüsü)
- B: Sesli tarif okuma TTS (Web Speech API TR-TR, kadın/erkek toggle)
- C: SKT süresi dolan öneri widget (zero-waste UX)
- D: Home dinamik "Şu saatte ne yesek" (TR timezone)
- E: "Beğenmedim, farklı dene" feedback (excludeSlugs)
- F: AI v3 miktar rozeti + shopping diff (v4 tutarlılık)
- G: Favori tarif → AI öneri boost (explicit + bookmark)
- H: Home 🎒 CTA + autoPantry flow (2 tık → 1 tık)
- I: Benzer tarifler filter chip (hızlı/az malzeme/az kalori)

**Mod F altyapı + 6 retrofit apply**: 600/2660 tarif (B+→A-→A+→A→A-→A+)
**Mod A seed**: 35a/35b/36a/36b (+200 tarif, 3252 → 3452)
**Mod B Backfill**: 11/12/13 apply (+250 çeviri, ~%93 tam)
**Backfill-14/15 CSV üretildi** (Codex'e bekliyor)
**Pantry miktar farkındalığı**: match util + rozet + SKT opt-in +
alışveriş→pantry senkron + Pişirdim→decrement (tüm döngü)
**Brief A+ standardı**: §5 Mod A + §15 Mod F, 5 self-check gate
**CI fix dalgası**: pantry test vi.hoisted + content:validate staple
severity + "biraz" muğlak fix + em-dash kod yorumu temizliği

## ✅ Oturum 16'da tamamlananlar (referans, detay PROJECT_STATUS.md)

- AI Asistan v4 TAM SHIP (core + UI + test + v4.1 cuisine + v4.2
  regenerate + macro + shopping + person count scaling + plan
  favorites + pantry history + autocomplete + preset chips) ✅
- Admin Tarif Düzenle: drag-drop reorder + çift onay modal silme +
  canlı preview pane ✅
- Mod A Batch 31a/31b + 32a apply (150 yeni tarif, 2872 → 3021) ✅
- Mod B Backfill-03/04/05/06/07/08 apply (485 çeviri) → **Mod B %100
  kapanış**, 3021/3021 tam çevirili ✅
- Blog 27-30 (4 yeni yazı, 12/9/9 ideal kategori denge) ✅
- Allergen 2 tur spot-fix + audit rule genişletme → prod RESULT PASS ✅
- PWA install events Sentry → Vercel Analytics taşındı (info-level
  spam durdu) ✅
- Tarif basit/lüks varyant paneli /tarif/[slug] ✅
- Codex Brief 2 önemli netleştirme (Backfill scope + renumber +
  translation script yasağı) ✅

**Kalan:** Batch 32b stub reject (gerçek içerikle re-teslim),
30 Nis Neon cleanup, Blog 31+, Codex 33a/33b+, v4.3 polish fikirleri.

## 🟢 Oturum 15 erken (silinmeden önce referans)

- Tailwind 4 `dark:` variant, `[data-theme]` attribute'una bağlandı
  (commit `c409342`). OS dark modundaki ziyaretçilerde light toggle
  sonrası kart bg'lerinin lacivert kalıp içeriği gizlemesi çözüldü.
- Mod E B14 apply (commit `648276a`), 100 tarif + 492 step, dev+prod.
  TR char 1934, ASCII trap 0, "ya da" 15 (trend azalma). Mod E
  toplam B1-B14 = 1400 tarif (~%48 catalog).
- Mod E B15 v1 REJECT, paraphrase + template yasağı ihlali: 23 cümle
  2+ tarifte tekrar (en ağır 32x "Yemeği birkaç dakika dinlendirip
  sıcak servis edin."). Codex'e net feedback + self-check komutu
  verildi. v2 geldi, 100 tarif + 499 step, kontroller en iyi seviye:
  template dup 0, "ya da" 0, TR 2865 (batch'ler arası en yüksek),
  ASCII trap 0. Dev + prod apply. Mod E toplam B1-B15 = 1500 tarif
  (~%52 catalog).
- Mod E B16 apply, 100 tarif + 500 step. BOM auto-fix (UTF-8 BOM
  dosya başında geldi, Node parse blocker; sildik). Audit temiz:
  TR 3203 (yeni en yüksek), template dup yalnız 4 cümle 2x (3+ tarif
  yok), "ya da" 1, timer 95/100 tarif, ASCII trap 0. Codex B17'ye
  feedback: (a) UTF-8 no-BOM yaz, (b) aynı cümle 2 tarifte bile
  geçmesin. Mod E toplam B1-B16 = 1600 tarif (~%56 catalog).
- CODEX_BATCH_BRIEF §14.5 + §14.7 B16 dersleri (commit `2a48d49`):
  UTF-8 no-BOM zorunlu + cümle tekrar yasağı + self-check bash
  komutları.
- Neon → Vercel Marketplace migration (commit `1506441`): standalone
  Neon (ep-broad-pond + ep-dry-bread) Vercel-managed Neon'a
  (ep-icy-mountain + ep-jolly-haze) taşındı. Docker postgres:17 ile
  pg_dump + pg_restore (prod 2.5MB / dev 2.3MB), row count 1:1 eşleşti,
  22 migration history intact. `scripts/lib/prisma.ts` runtime URL
  seçimi (VERCEL_ENV check, Preview/Dev `DATABASE_URL_DEV`) integration
  çakışmasını atladı. Tasarruf $20/ay = $240/yıl. 1 hafta rezerv,
  30 Nis cleanup.
- Mod E B17 apply (yeni Neon üzerinden ilk apply, 100 tarif + 486
  step). Audit en iyi seviye: BOM yok, template dup 0, TR 3174,
  ASCII trap 0, "ya da" 7. Mod E B1-B17 = 1700 tarif (~%60 catalog).
- Mod E B18 apply (100 tarif + 504 step, step count rekor). Audit:
  BOM yok, template dup 0, TR 3204 (yeni rekor), "ya da" 4 (düşüyor),
  timer 96/100 tarif (yeni rekor). Mod E B1-B18 = 1800 tarif
  (~%64 catalog).
- Mod E B19 apply (100 tarif + 499 step). Audit: BOM yok, template
  dup 0, TR 3261 (yeni rekor), ASCII trap 0. "ya da" 6 (legitimate
  alternatifler), "malzemesini" 2 (false-positive: "iç malzemesini"
  = böreğin içi substantif, gramer doğru). Mod E B1-B19 = 1900 tarif
  (~%68 catalog).
- Mod E B20 üç tur rework: v1 REJECT (33 tarif template smuggling,
  `{TARIFADI} hazır olduğunda sıcak ya da ılık biçimde servis edin`
  ve `{TARIFADI} tarifini bekletmeden ya da kısa dinlenmeyle sofraya
  çıkarın` kalıpları; "ya da" 39). v2 REJECT (template + "ya da"
  düzeldi ama 1427 `?` karakteri, UTF-8 encoding bozulması, TR chars
  1521'e düştü). v3 temiz: TR 2945, `?` = 0, template dup 0, "ya da" 3,
  "malzemesini" 0. Apply dev+prod. Mod E B1-B20 = 2000 tarif (~%72
  catalog, yolun dörtte üçü).
- Mod E B21 apply (100 tarif + 487 step). Audit en iyi seviye:
  TR 4084 (yeni rekor), `?` = 0, template dup 0, "ya da" 4, "malze-
  mesini" 0, timer 97/100 tarif (yeni rekor). B20 derslerinden sonra
  Codex direkt temiz teslim etti. Mod E B1-B21 = 2100 tarif (~%76
  catalog).
- Mod E B22 apply (100 tarif + 486 step). Audit: TR 3872, `?` = 0,
  template dup 0, "ya da" 7, "malzemesini" 0, timer **99/100** (yeni
  rekor, neredeyse tüm tarifler timer'lı). Mod E B1-B22 = 2200 tarif
  (~%80 catalog, beşte dördü).
- Mod E B23 üç tur rework (v3.1 onay): v1 REJECT (tüm dosya ASCII-only,
  TR chars 0, B12 v1 tekrarı). v2 REJECT (TR 0 → 3022 yükseldi ama
  54 ASCII kalıntı, en düşük TR oran %2.4). v3 REJECT (TR 3956 iyi
  ama 3 kelime hâlâ corrupt: pisirdikten/yumusayan/yumusakligi).
  v3.1: Claude tarafında spot fix 3 kelime (1 dk iş), Codex v4 atmak
  yerine direkt düzelt + apply. Mod E B1-B23 = 2300 tarif (~%84).
- Mod E B24 apply (100 tarif + 501 step + 1 tarif 5 ingredient revize).
  Audit direkt temiz teslim: TR 4075, template dup 0, "ya da" 8,
  "malzemesini" 0, timer 99/100 tarif. Codex paralel session B23
  rework'ünden ayrı üretti. Mod E B1-B24 = 2400 tarif (~%87 catalog).
- Mod E B25 apply (100 tarif + 489 step + 1 tarif 7 ingredient revize
  muhammara-gaziantep). Audit: TR 3375, `?` = 0, template dup 0,
  ASCII corrupt 0, "malzemesini" 0, timer 91/100. "ya da" 16,
  hepsi legitimate alternatif (ızgara/tava, fırın/köz, soğuk/ılık,
  üçgen/bohça, rulo/zarf), smuggling yok. Mod E B1-B25 = 2500 tarif
  (~%91 catalog, on dokuzda on sekizi).
- Mod E B26 apply (100 tarif + 499 step). Audit: TR 3768, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer 87/100.
  "ya da" 25, hepsi legitimate alternatif (tava/ızgara, sac/tava,
  fırın/taş zemin, ılık/soğuk, rulo/üçgen, kaşık/asma yaprak); tarif
  adı değişken template smuggling yok, exact-match 0. Mod E B1-B26
  = 2600 tarif (~%94 catalog).
- Mod E B27 apply (100 tarif + 494 step). Audit: TR 3375, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer 81/100
  (son batch'lerde timer oranı azalma trend: B24=99, B25=91, B26=87,
  B27=81; kritik değil). "ya da" 15 (Codex kendi raporladığı sayıya
  eşit, disiplin oturdu). Mod E B1-B27 = 2700 tarif (~%98 catalog).
- Mod E B28 apply (100 tarif + 498 step). Audit: TR 3389, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer **95/100**
  (toparlandı, B27=81'den yükseldi). "ya da" 11 (düşüş trend devam).
  Mod E B1-B28 = 2800 tarif.
- Mod E B29 apply (100 tarif + 330 step, kısa tarifler: icecek /
  kokteyl / aperatif "few-steps" flag'li, type minimum eşiğine
  oturtuldu). Audit: TR 2500, `?` 0, ASCII corrupt 0, template
  dup 0, **"ya da" 0 (yeni rekor, ilk kez sıfır)**, "malzemesini" 0,
  timer 69/100 (kısa tariflerde timer az, normal). **Mod E B1-B29
  toplam 2900 tarif apply, Mod E pipeline kapandı.** B30 CSV (38
  marjinal tarif) Mod A numara çakışmasını önlemek için silindi.

---

## ✅ Oturum 14'te tamamlananlar (silinmeden önce burada referans)

Hızlı snapshot, detay PROJECT_STATUS.md'de:
- Admin "Tarif Düzenle" formu ✅
- AI Asistan v3 (reason chip + cuisine diversity) ✅
- Hero badge çeşitlilik vurgusu (24 mutfak) ✅
- Mod E Brief §14 B6+ ince ayar (paraphrase + type + servis esneklik) ✅
- Mod E B1-B13 apply (1300 tarif, ~%45 catalog) ✅
- Mod E B11-B30 CSV hazır (20 batch kuyruk) ✅
- Audit script --batches / --batch-offset / --slice-offset flag ✅
- 20 yeni blog yazısı (Blog 5-25, kategori 11/7/7) ✅
- Blog citation standardı 4 yazıya retro-apply ✅
- BLOG_CONTENT_GUIDE.md editöryal standart ✅
- feedback_output_format.md memory ✅
- Fix script disiplin (B8 v3 + B12 v3) ✅
- Cleanup + .gitignore lh-*.json ✅
