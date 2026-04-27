# Test Report: Oturum 26 Kategori 6 (A11y Deep Audit)

Tarih: 2026-04-27 (oturum 26)
Test kapsamı: Keyboard nav + heading hierarchy + landmark roles + color contrast + touch target + ARIA-live + form labels + reduced motion
Süre: ~45 dk
Yöntem: Browser preview MCP (desktop 1440x900 + mobile 375x812) + DOM inspection + WCAG 2.1 AA conformance kontrolü

## Özet (üst seviye)

| Test | Sonuç |
|---|---|
| Skip link ("Ana içeriğe atla") | ✅ Mevcut, sr-only + focus:not-sr-only pattern, target #main-content |
| h1 count per page | ✅ 1 h1 (anasayfa "Bugün ne pişirsek?") |
| Heading hierarchy (h1>h2>h3) | ✅ 0 level skip (55 heading anasayfada) |
| Landmark roles (header/nav/main/footer) | ✅ Tümü mevcut, main id="main-content" |
| Form label association | ⚠️ 1 input label yok (newsletter footer) |
| ARIA-live regions | ✅ 4 region (3 timer + 1 polite) tarif detayda |
| Image alt text | ✅ 0 missing alt (tarif detay tüm img alt'lı) |
| Reduced motion respect | ⚠️ Tailwind motion-safe utility kullanılmıyor |
| Color contrast (light/dark) | ⚠️ Manuel inceleme: muted text 12px + #a0a0a0 marjinal |
| Touch target (mobile 44×44) | ⚠️ 15+ element <44px (breadcrumb 18px **FİX'lendi**, header icon 36, action btn 38, servings 32) |

## FIX'lendi bu commit

**1. Tarif detay breadcrumb mobile touch target (K3 + K6 birleşik bulgu)**
- Lokasyon: `src/app/tarif/[slug]/page.tsx:425-440`
- Önce: `<Link href="..." className="hover:text-text">` 18px height
- Sonra: `<Link className="inline-flex min-h-[44px] items-center px-1 hover:text-text">` 44px height ✓
- Plus: `aria-current="page"` son span'a eklendi (current page indicator)
- Mobile browser preview verify: 18px → 44px ✓ (WCAG 2.5.5 Target Size AAA conformance)

## Bulgular (FIX edilmemiş)

### P0 - Launch blocker
**Yok.**

### P1 - Yüksek değer
**Yok yeni P1.** K6'nın breadcrumb bulgusu fix'lendi.

### P2 - Monitoring / iyileştirme

**1. Newsletter footer input label yok**
- Lokasyon: footer (4. form, name="" placeholder="ornek@mail.com")
- Mevcut: Sadece placeholder, label[for=...] veya aria-label yok
- Önerilen: `<label htmlFor="newsletter-email" className="sr-only">E-posta adresi</label>` veya `aria-label="Bülten e-posta"`
- Etki: Screen reader user input'un ne için olduğunu bilmez
- 5 dk fix

**2. Header icon button mobile 36×36 (44 altı)**
- Lokasyon: Navbar.tsx (TR/Tema/Bildirim/Menüyü aç + logo 28px height)
- Mevcut: 4 icon button h-9 w-9 (36×36); logo h-7 (28px)
- Önerilen: Mobile için h-11 w-11 (44×44) Tailwind class set
- Etki: Mobil tap accuracy iyileşir (yanlış buton dokunma riski azalır)
- Scope: 10 dk Tailwind conditional class

**3. Action button mobile 38px height (Kaydet/Listeye/Koleksiyon/Paylaş)**
- Lokasyon: SaveMenu.tsx group + Pişirdim toggle + servings adjuster
- Mevcut: py-2 (38px height); servings ± 32×32; "Dolabımı düzenle →" 16px height
- Önerilen: py-3 mobile için (48px height); servings min-h-[44px]; pasif text link "Dolabımı düzenle" yerine button-like padding
- Scope: 30 dk Tailwind class sweep + spot check

**4. Color contrast manuel doğrulama (12px muted)**
- Bulgu: `text-text-muted` rgb(160,160,160) on dark bg + 12px font-size
- WCAG 2.1 AA: 18pt+ normal text 4.5:1, 14pt+ büyük 3:1. 12px küçük text 7:1 önerilir.
- Tahmin: 5.5:1 dark mode'da, marjinal AA Pass ama 12px küçük punto'da AAA fail
- Önerilen: `text-text-muted` semantic token'ını dark mode için biraz daha açık (rgb(180,180,180))
- Scope: Tailwind config palette tweak, görsel review

**5. Reduced motion (Tailwind motion-safe utility kullanılmıyor)**
- Bulgu: `prefers-reduced-motion: reduce` aktif user için animasyonlar respect ediliyor mu kontrol edilmedi
- Mevcut: Framer Motion default behavior (auto-respect mu?), Tailwind `motion-safe:` veya `motion-reduce:` 0 utility
- Önerilen: Hero parallax, CountUp animation, transition-* class'lar `motion-safe:` ile sarılmalı; reduced-motion kullanıcıları için anında render
- Scope: 30 dk Hero + animasyonlu component sweep

### P3 - Düşük öncelik

**6. Servings adjuster ± button 32×32 mobile**
- Lokasyon: tarif detay porsiyon sayısı +/- adjuster
- Mevcut: 32×32 (44 altı, az kullanılan UI)
- Önerilen: min-h-[44px] mobile için
- Acil değil, dar kullanım

## PASS bulguları (iyi a11y pattern)

**1. Skip link pattern**
- `<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Ana içeriğe atla</a>`
- Klavye user (Tab) sayfaya gelir gelmez skip link focus alır, Enter ile main'e atlar
- visual hidden ama focus'ta görünür (modern best practice)

**2. Heading hierarchy temiz**
- 55 heading anasayfada, 0 level skip
- h1 = 1 (her sayfa tek h1), h2/h3 mantıklı subsection

**3. Landmark semantik HTML**
- `<header>`, `<nav>`, `<main id="main-content">`, `<footer>`: hepsi mevcut
- ARIA role override yok (native semantic kullanılıyor)

**4. ARIA-live regions (tarif detay)**
- 4 region: 1 polite + 3 timer (cooking mode timer state changes)
- Screen reader async durum değişikliklerini anons eder

**5. Image alt text disipline**
- 0 missing alt görünür image'larda (RecipeCard kullanımı Next/Image with alt prop)

**6. ARIA labels (button/link)**
- TR/Tema/Bildirim/Menüyü aç gibi icon-only button'larda aria-label var
- Profile menu trigger aria-controls + aria-expanded + aria-haspopup="menu" ✓ (proper menu pattern)

**7. Form label association (auth forms)**
- /giris + /kayit + /sifremi-unuttum: label[for=id] tüm field'larda mevcut (K1'de doğrulandı)
- KVKK checkbox required + label association

## Test edilemediler (sınırlamalar)

- **Screen reader real test (NVDA/VoiceOver)**: Browser preview emulator değil, gerçek AT software ile test gerek
- **Keyboard navigation flow real test**: tab-by-tab traversal manuel test, otomatik sweep yetersiz
- **Color contrast precise WCAG ratio**: Tool gerek (Stark/Contrast/Lighthouse), tahmin
- **Modal trap (focus container)**: Modal açılınca Tab'in trap olması, ESC ile close - manuel real test
- **Cross-browser AT compatibility**: Chrome/NVDA, Safari/VoiceOver, Edge/Narrator farklı pattern
- **Mobile a11y (TalkBack/VoiceOver iOS)**: Real cihaz gerek

## Test ortamı

- Browser preview MCP (Chrome DevTools)
- Viewports: 1440×900 desktop + 375×812 mobile (iPhone simulasyon)
- DOM inspection: document.querySelectorAll, getBoundingClientRect
- Sayfalar: anasayfa (55 heading), tarif/adana-kebap (4 ARIA-live), /kayit + /giris (form labels)

## Sonraki adım

K6 bulguları küçük (0 P0 + 0 yeni P1 + 5 P2 + 1 P3); en kritik (breadcrumb touch target) bu commit'te fix'lendi.

Geri kalan P2/P3'ler launch sonrası standart a11y polish:
1. Newsletter input label (5 dk)
2. Header icon mobile 44×44 (10 dk)
3. Action button mobile py-3 sweep (30 dk)
4. text-text-muted dark contrast tweak (15 dk)
5. motion-safe utility sweep (30 dk)

Test Campaign sıradakiler:
- **K5 (Perf + SEO + Structured Data, P1, ~1 saat)** - Lighthouse mobile + desktop 10 sayfa, Rich Results Test
- **K4 (Form Edge Case, P1, ~1 saat)** - daha derin form test, AI Asistan limit
- **K8 (Cross-browser + PWA, P2, ~45 dk)** - real cihaz test
