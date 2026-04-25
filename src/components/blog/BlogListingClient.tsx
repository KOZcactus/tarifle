"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export interface BlogPostListItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category?: string;
  coverEmoji?: string;
  readingMinutes: number;
}

export interface BlogCategoryMeta {
  slug: string;
  emoji: string;
}

interface BlogListingClientProps {
  posts: BlogPostListItem[];
  categories: BlogCategoryMeta[];
}

function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

interface TopicGroup {
  key: string;
  emoji: string;
  label: string;
  slugs: string[];
}

/**
 * Konu grupları: ana malzeme / tema bazında blog yazılarını kümeleyen
 * sidebar navigasyon. "Aylara göre" arşiv launch öncesinde değer vermiyor
 * (tüm yazılar yakın tarihlerde), oturum 19'da bununla değiştirildi.
 *
 * Slug-based mapping: yeni blog eklenince bu liste güncellenmeli; ileride
 * frontmatter'a `topicGroup` alanı eklenerek otomatize edilebilir.
 */
const TOPIC_GROUPS: TopicGroup[] = [
  {
    key: "et-balik",
    emoji: "🥩",
    label: "Et & Balık",
    slugs: [
      "et-muhurlemenin-bilimi",
      "et-bolgeleri-rehberi-dana-hangi-pisirme",
      "soguk-zincir-kirmizi-et-guvenligi",
      "balik-secimi-temizlik-ve-pisirme",
      "balik-mevsimleri-turkiye-denizleri-rehberi",
    ],
  },
  {
    key: "sut-urunleri",
    emoji: "🥛",
    label: "Süt Ürünleri",
    slugs: [
      "tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim",
      "peynir-cesitleri-turk-mutfagi-rehberi",
      "fermentasyon-temelleri-yogurt-tursu-eksi-maya",
    ],
  },
  {
    key: "hamur-ekmek",
    emoji: "🌾",
    label: "Hamur & Ekmek",
    slugs: [
      "un-cesitleri-protein-kullanim-rehberi",
      "makarna-cesitleri-sos-eslestirme-rehberi",
      "pilavin-bilimi",
      "maya-kabartma-tozu-karbonat-farki",
    ],
  },
  {
    key: "sebze-baharat",
    emoji: "🌿",
    label: "Sebze & Baharat",
    slugs: [
      "domates-cesitleri-hangi-tarif-icin-hangi-tip",
      "zeytin-cesitleri-sofralik-meze-rehberi",
      "soganin-dogru-kavrulmasi",
      "sarimsak-dogru-kullanimi-kimya-pisirme-saklama",
      "baharat-dolabi-temelleri-secim-saklama-kullanim",
      "baharat-ogutme-taze-hazir-kavurma-saklama",
      "tuz-cesitleri-ve-kullanimi",
      "zeytinyagi-secimi",
    ],
  },
  {
    key: "icecek",
    emoji: "🫖",
    label: "İçecek",
    slugs: [
      "kahve-mi-cay-mi-secim-rehberi",
      "kahve-demlemesi-turk-espresso-french-press-v60",
      "turk-cayi-kulturu-demleme-sofra-sosyal-hayat",
    ],
  },
  {
    key: "kultur",
    emoji: "🏺",
    label: "Türk Mutfağı Kültürü",
    slugs: [
      "turk-kahvaltisinin-mantigi",
      "turk-mutfaginin-yedi-bolgesi",
      "anadolunun-unutulmus-yemekleri",
      "bayram-sofrasi-ramazan-kurban-yemek-gelenekleri",
      "ramazan-sofrasi-iftar-sahur-kultur",
      "turk-mutfaginda-dugun-sofrasi",
      "turk-mutfaginda-tatli-felsefesi",
      "turk-mutfaginda-zeytinyagli-yemek-gelenegi",
    ],
  },
  {
    key: "pisirme-temelleri",
    emoji: "🔥",
    label: "Pişirme Temelleri",
    slugs: [
      "yumurta-pisirme-7-yontem",
      "firin-kullanimi-raf-isi-on-isitma",
      "mutfak-ocaklari-induksiyon-gaz-elektrik-dokum",
      "su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi",
      "evde-tarif-uyarlama-porsiyon-olcu-degiskenler",
      "evde-dondurma-ve-dondurucu-saklama-rehberi",
    ],
  },
  {
    key: "mutfak-pratik",
    emoji: "🔪",
    label: "Mutfak Pratik",
    slugs: [
      "mutfak-bicagi-secimi-ve-kullanimi",
      "mutfak-ekipman-olmazsa-olmazlari",
      "ev-mutfagi-hijyen-temelleri",
      "diyet-skoru-nasil-hesaplanir",
    ],
  },
];

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function BlogListingClient({ posts, categories }: BlogListingClientProps) {
  const t = useTranslations("blog");
  const tCat = useTranslations("blog.categories");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTopicGroup, setActiveTopicGroup] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const normalizedQuery = query.trim().length >= 2 ? normalize(query) : "";

  // Konu grupları: her grup icin aktif (DB'de bulunan) post sayisini hesapla.
  // Sidebar rozet + 0 sayili grup gizleme icin.
  const topicGroupCounts = useMemo(() => {
    const slugSet = new Set(posts.map((p) => p.slug));
    const out = new Map<string, number>();
    for (const g of TOPIC_GROUPS) {
      const count = g.slugs.filter((s) => slugSet.has(s)).length;
      out.set(g.key, count);
    }
    return out;
  }, [posts]);

  // Kategori başına count (sidebar rozet için).
  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) {
      if (p.category) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    }
    return m;
  }, [posts]);

  // Aktif kategorideki alt tag listesi, frekansa göre sıralı. Kategori
  // seçili değilken tüm posts'ın tag'leri (de zoom-out görünüm).
  const relevantTags = useMemo<{ tag: string; count: number }[]>(() => {
    const freq = new Map<string, number>();
    const pool = activeCategory
      ? posts.filter((p) => p.category === activeCategory)
      : posts;
    for (const p of pool) {
      for (const tag of p.tags ?? []) {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); // top 12 tag, sidebar taşmasın
  }, [posts, activeCategory]);

  // Aktif topic group'un slug set'i (filter'de membership check icin).
  const activeTopicSlugs = useMemo(() => {
    if (!activeTopicGroup) return null;
    const g = TOPIC_GROUPS.find((x) => x.key === activeTopicGroup);
    return g ? new Set(g.slugs) : null;
  }, [activeTopicGroup]);

  // Filtre uygulanmış liste.
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (activeTag && !(p.tags ?? []).includes(activeTag)) return false;
      if (activeTopicSlugs && !activeTopicSlugs.has(p.slug)) return false;
      if (normalizedQuery) {
        const haystack = normalize(
          `${p.title} ${p.description} ${p.tags.join(" ")}`,
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [posts, activeCategory, activeTag, activeTopicSlugs, normalizedQuery]);

  const hasActiveFilter =
    query.length > 0 ||
    activeCategory !== null ||
    activeTag !== null ||
    activeTopicGroup !== null;

  function resetFilters() {
    setQuery("");
    setActiveCategory(null);
    setActiveTag(null);
    setActiveTopicGroup(null);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      {/* Sidebar: mobilde üstte, desktop'ta sol + sticky */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-5 rounded-2xl border border-border bg-bg-card p-4 lg:p-5">
          {/* Arama */}
          <div>
            <label
              htmlFor="blog-search"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
            >
              {t("sidebar.searchLabel")}
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                id="blog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("sidebar.searchPlaceholder")}
                className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-8 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                aria-label={t("sidebar.searchLabel")}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text"
                  aria-label={t("sidebar.searchClear")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("sidebar.categoriesLabel")}
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                    activeCategory === null
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-text-muted hover:bg-bg-elevated hover:text-text"
                  }`}
                >
                  <span>{t("sidebar.allCategories")}</span>
                  <span className="tabular-nums text-xs text-text-muted">
                    {posts.length}
                  </span>
                </button>
              </li>
              {categories.map((c) => {
                const count = countByCategory.get(c.slug) ?? 0;
                const active = activeCategory === c.slug;
                return (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(active ? null : c.slug);
                        // Kategori değişince tag seçimini sıfırla,
                        // tag başka kategoride geçerli olabilir.
                        setActiveTag(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-text-muted hover:bg-bg-elevated hover:text-text"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden>{c.emoji}</span>
                        {tCat(c.slug)}
                      </span>
                      <span className="tabular-nums text-xs text-text-muted">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Alt konular (aktif kategorideki tag'ler, yoksa tüm) */}
          {relevantTags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {activeCategory
                  ? t("sidebar.subtopicsForCategory", {
                      category: tCat(activeCategory),
                    })
                  : t("sidebar.subtopicsLabel")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {relevantTags.map(({ tag, count }) => {
                  const active = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(active ? null : tag)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-border bg-bg text-text-muted hover:border-primary/40 hover:text-text"
                      }`}
                      aria-pressed={active}
                    >
                      <span>#{tag}</span>
                      <span className="tabular-nums text-text-muted/70">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Konu grupları (ana malzeme/tema bazlı) */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("sidebar.topicGroupsLabel")}
            </p>
            <ul className="space-y-1">
              {TOPIC_GROUPS.map((g) => {
                const count = topicGroupCounts.get(g.key) ?? 0;
                if (count === 0) return null;
                const active = activeTopicGroup === g.key;
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTopicGroup(active ? null : g.key)
                      }
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-text-muted hover:bg-bg-elevated hover:text-text"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden>{g.emoji}</span>
                        {g.label}
                      </span>
                      <span className="tabular-nums text-xs text-text-muted">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-md border border-border bg-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              {t("sidebar.resetFilters")}
            </button>
          )}
        </div>
      </aside>

      {/* Sağ ana alan */}
      <main>
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            {t("subtitle")}
          </p>
          <p className="mt-3 text-xs text-text-muted">
            {hasActiveFilter
              ? t("resultsFiltered", {
                  count: filtered.length,
                  total: posts.length,
                })
              : t("resultsTotal", { count: posts.length })}
          </p>
        </header>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <h2 className="font-heading text-xl font-semibold">
              {hasActiveFilter
                ? t("emptyFilteredTitle")
                : t("emptyTitle")}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {hasActiveFilter
                ? t("emptyFilteredBody")
                : t("emptyBody")}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                {t("sidebar.resetFilters")}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((post) => {
              const category = categories.find((c) => c.slug === post.category);
              return (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-primary hover:bg-bg-elevated sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl"
                      >
                        {post.coverEmoji ?? "📝"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          {category && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                              {category.emoji} {tCat(category.slug)}
                            </span>
                          )}
                          <time
                            dateTime={post.date}
                            className="tabular-nums"
                          >
                            {formatDate(post.date)}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span>
                            {t("readingMinutes", { minutes: post.readingMinutes })}
                          </span>
                        </div>
                        <h2 className="font-heading text-lg font-semibold text-text transition-colors group-hover:text-primary sm:text-xl">
                          {post.title}
                        </h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                          {post.description}
                        </p>
                        {post.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] text-text-muted"
                              >
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 4 && (
                              <span className="inline-flex items-center text-[10px] text-text-muted/70">
                                +{post.tags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
