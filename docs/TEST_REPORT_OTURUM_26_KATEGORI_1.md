# Test Report: Oturum 26 Kategori 1 (Yeni Kullanıcı Onboarding)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: Anonim user flow + auth forms + post-login onboarding + persistence
Süre: ~1 saat (browser preview MCP + manual UX inspection)
Yöntem: Browser preview Chrome DevTools desktop (1440x900) + mock user yaratma + login akışı simülasyonu

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| Anonim header navigation | ⚠️ "Kayıt Ol" button eksik (sadece Giriş) |
| Cookie banner KVKK | ✅ /kayit'te "Anladım" görünüyor (sandbox'ta önceden dismiss edilmiş) |
| Hero CTA prominence | ⚠️ Register CTA hero'da yok ("Ücretsiz Üye Ol" alt section) |
| Anonim "Kaydet" akışı | ⚠️ /giris redirect var ama callbackUrl param yok |
| /giris form UX + a11y | ✅ Label association, autocomplete, OAuth, kayıt + şifre sıfırla linki |
| /kayit form UX + a11y | ✅ KVKK checkbox required, OAuth, label association, ⚠️ maxLength yok |
| /sifremi-unuttum UX | ✅ Helper text + prominent submit button |
| Profil tamamla banner | ✅ Login sonra "Profilini tamamla" + "Diyet tercih?" prompt |
| /dolap empty state | ✅ Mükemmel: HIZLI BAŞLA preset chips (yumurta/soğan/sarımsak/domates/tuz) |
| AI Asistan ilk deneyim | ✅ 6 hızlı başlangıç preset + 12 ingredient chip + 36 cuisine + filtre |
| Profil sayfası empty states | ✅ Her bölümde açıklayıcı CTA (Koleksiyon/Uyarlama/Yorum/Favori) |
| Logout flow | ✅ Anasayfaya redirect, profile menu kayboldu, Giriş linki geldi |
| Tema/locale persistence | ✅ Dark mode + TR locale logout sonrası korundu |

## Bulgular (P0/P1/P2/P3)

### P0 - Launch blocker
**Yok.** Hiçbir kritik akış kırık değil.

### P1 - Yüksek değer

**1. Header'da "Kayıt Ol" CTA button yok (anonim user için)**
- Lokasyon: `src/components/layout/Navbar.tsx` (veya benzeri header component)
- Mevcut: Sadece "Giriş" link header sağ üst (62×36px küçük)
- Sorun: Anonim user için primary CTA "Kayıt" olmalı (yeni user funnel'i için)
- Önerilen: "Giriş" + ayrı prominent "Kayıt Ol" button (filled primary), header sağ üstte yan yana
- Etki: Conversion rate artışı (yeni user kayıt friction azalır)
- Ekran genişliği: 1440px desktop'ta tespit edildi; mobil hamburger menu içinde gizli olabilir, ek kontrol gerek

**2. Hero'da register CTA prominent değil**
- Lokasyon: `src/app/page.tsx` (anasayfa hero)
- Mevcut: Hero h1 "Bugün ne pişirsek?" + hashtag chips (karnıyarık, baklava, mojito, mercimek). "Ücretsiz Üye Ol" daha aşağı section'da.
- Sorun: Anonim user için "Tarif keşfet" yerine "Hemen Başla / Kayıt Ol" hero CTA daha güçlü dönüşüm sağlar
- Önerilen: Hero altına "Ücretsiz Üye Ol" button (large, primary), eksik bilgi "Dolap + AI Asistan + Menü Planlayıcı" 3 madde benefit
- Etki: Hero scroll-down'a inmeden conversion

**3. Anonim "Kaydet" → /giris redirect callbackUrl param yok**
- Lokasyon: `src/components/recipe/SaveButton.tsx` veya `BookmarkButton.tsx`
- Mevcut: /tarif/adana-kebap'ta "Kaydet" tıkla → `/giris` (search:"")
- Sorun: Login sonrası kullanıcı tarif sayfasına otomatik dönmeli. callbackUrl ile auth.js v5 handleAuth otomatik yönlendirir
- Önerilen: SaveButton onClick'te `router.push('/giris?callbackUrl=' + encodeURIComponent(window.location.pathname))`
- Plus auth.js v5 signin'de `redirectTo` veya `callbackUrl` server-side handle
- Etki: User retention (kayıt sonrası tarif kaybı önlenir)

**4. /kayit password maxLength yok (DoS vector)**
- Lokasyon: `src/app/kayit/page.tsx` form input
- Mevcut: `<input type="password" required minLength="6">` - maxLength tanımlanmamış
- Sorun: Kullanıcı 1000+ char password gönderirse bcrypt hash 100ms+ sürer (CPU-bound). Brute force veya DoS attack vector
- Önerilen: `maxLength={128}` (NIST SP 800-63B, modern auth standardı). Plus server-side Zod schema'da `.max(128)` zorunlu
- Etki: Server stability (bcrypt amplification attack)

### P2 - Monitoring / iyileştirme

**5. Password strength indicator yok**
- Lokasyon: `/kayit` form
- Mevcut: Plain `<input type="password">` field, güç göstergesi yok
- Önerilen: zxcvbn library veya basit kural-tabanlı (uzunluk + karakter çeşitliliği) → 4 seviye visual indicator (zayıf/orta/iyi/güçlü)
- Etki: Modern UX, kullanıcı şifre seçim eğitimi

**6. Password minLength sadece 6**
- Lokasyon: `/kayit` form + (varsayılan) Zod schema
- Mevcut: `minLength="6"`
- Önerilen: 8+ veya 12+ (NIST SP 800-63B 8 char minimum, 64 max). Modern best practice 12+ char + complexity
- Etki: Brute-force resistance

**7. Captcha yok**
- Lokasyon: /kayit + /giris + /sifremi-unuttum + /iletisim formları
- Mevcut: Upstash Redis rate limit (oturum brief'inde geçti)
- Sorun: Görsel captcha yok, sadece IP-based rate limit. Distributed brute-force (botnet) etkilenmez
- Önerilen: launch öncesi hCaptcha veya Cloudflare Turnstile. Şimdilik rate limit yeterli olabilir.
- Etki: Spam account creation engellenir

**8. Cookie banner persistence test scope dışı**
- Lokasyon: `src/components/legal/CookieBanner.tsx`
- Tespit: Test sandbox'ta cookie consent zaten verilmiş, banner görünmüyordu (anasayfa)
- /kayit'te "Anladım" butonu görünüyor - banner var ama dismiss-state cookie'si HttpOnly veya server-set, JS clear edemiyor
- Önerilen takip: Gerçek incognito Chrome'da banner görünüm + dismiss + cookie set + reload sonrası gizleme akışı tek seferlik manuel test

### P3 - Düşük öncelik / monitoring

**9. Profil sayfası 0-stat görünüyor (kendi profil)**
- Lokasyon: `/profil/[username]` (kendi profil)
- Mevcut: "0 uyarlama / 0 takipçi / 0 takip / Chef Puanı: 0 / 0 kayıtlı tarif"
- Karşılaştırma: Oturum 25'te ReviewsSection + SuggestedCooksSection eşik altı sayı saklama yapıldı (count=0 → CTA empty state)
- Sorun: Profil sayfası tutarlılık için 0-stat'ları gizleyebilir
- Karşı argüman: Kendi profil için bu OK (kullanıcı kendi 0 sayılarını bilir, "uyarlama yapacaksın" implicit CTA). Başka kullanıcının profilinde 0-stat saklanmalı.
- Önerilen takip: `/profil/[username]` sayfasında session.user.id !== profileUser.id ise 0-stat gizleme

## PASS bulguları (iyi UX, sürdürmek için kayıt)

**1. /dolap empty state mükemmel**
- Açıklayıcı yardım: "Evdeki malzemeleri buraya ekle; AI Asistan ve Haftalık Menü Planlayıcı tek tıkla bu listeyi kullansın."
- "🎒 Dolabın boş" empty visual
- "HIZLI BAŞLA" preset chips: + yumurta, + soğan, + sarımsak, + domates, + tuz (1-tık ekleme)
- Yeni kullanıcı için friction sıfır

**2. AI Asistan onboarding zengin**
- 6 "Hızlı başlangıç" preset (Misafir Sofrası, Çocuk Dostu, Hafif Akşam, Pratik, Parti Atıştırmalığı, Tatlı Kaçamağı)
- 12 ingredient chip (tavuk/soğan/domates/yumurta/patates/biber/pirinç/makarna/peynir/havuç/kabak/nohut)
- "🎒 Dolabımı getir" 1-tık import
- "🎤 Sesli ekle" Web Speech API
- "Bu malzemeler olmasın" exclude alanı (allergy/preference)
- 5 zorluk + 5 süre + 36 cuisine + 10 type filtreleri

**3. Profil sayfası empty states açıklayıcı**
- "📁 Henüz koleksiyon yok - Beğendiğin tarifleri tema veya menüye göre gruplandır. Bir tarifi açıp 'Koleksiyon' butonuyla başla, sonra buradan listele."
- "Tarifleri keşfet" CTA empty state'lerde
- "Henüz uyarlama eklenmemiş" / "Henüz bir tarife yorum bırakmadın" / "Henüz favori..."
- 4 stat card (UYARLAMA / ALDIĞI BEĞENİ / YORUM / KOLEKSİYON)

**4. Login sonrası onboarding banner**
- "👤 Profilini tamamla - Biyografi ve avatar eklersen AI önerileri daha isabetli olur"
- "🎯 Diyet tercih ediyor musun? BETA - Tercih ettiğinde her tarifte sa..." (kayma)

**5. Form a11y temiz**
- /giris + /kayit + /sifremi-unuttum hepsinde label[for=...] + autocomplete + required
- KVKK checkbox required ✓ (legal compliance)

**6. Theme + locale persistence**
- Dark mode toggle logout sonrası korundu (cookie-based)
- TR locale persisted

**7. Logout flow temiz**
- Profile menu kayboldu, header'da "Giriş" link geldi
- Anasayfaya redirect doğru

## Test ortamı

- Browser preview MCP (Chrome DevTools)
- Viewport: 1440×900 desktop (mobile spot-check Kategori 3'te yapıldı)
- Mock user: `oturum26-test@tarifle.local` / `TestPass1234!` (USER role, emailVerified=now)
- Cleanup: User silindi (--delete flag), AuditLog kaydı yok (test user)

## Test edilemediler (sınırlamalar)

- Welcome email gerçek delivery (Resend dev mode, real inbox erişimi yok)
- Email doğrulama linki akışı (emailVerified=now bypass)
- Captcha gerçek davranışı (yoksa, eklenirse test gerek)
- Cookie banner ilk-açılış davranışı (sandbox'ta dismiss edilmiş)
- Mobile hamburger menu içinde Kayıt link var mı (Kategori 3'te kontrol edilebilir, separate test)
- Kategori 8 cross-browser akışı (iOS Safari / Firefox / Edge gerçek cihaz)

## Sonraki adım

Bulguların prioritization:
1. **P1 #3 (callbackUrl)** - 30 dk fix, yüksek user retention etkisi
2. **P1 #4 (password maxLength)** - 5 dk fix, security hardening
3. **P1 #1 + #2 (header + hero CTA)** - 1-2 saat fix, conversion rate
4. **P2 monitoring** - launch öncesi opsiyonel iyileştirmeler
