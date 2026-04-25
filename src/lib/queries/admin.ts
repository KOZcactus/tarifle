import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CUISINE_LABEL, CUISINE_FLAG, type CuisineCode } from "@/lib/cuisines";

/** Bekleyen raporları getir */
export async function getPendingReports() {
  return prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: {
        select: { username: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Tüm raporları getir (filtreleme ile) */
export async function getReports(status?: string) {
  const where: Record<string, unknown> = {};
  if (status && ["PENDING", "REVIEWED", "DISMISSED"].includes(status)) {
    where.status = status;
  }

  return prisma.report.findMany({
    where,
    include: {
      reporter: {
        select: { username: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Preflight tarafından PENDING_REVIEW'a düşmüş yorumlar */
export async function getPendingReviews() {
  return prisma.review.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, username: true } },
      recipe: { select: { slug: true, title: true } },
    },
  });
}

/** Hakkında PENDING rapor olan yorumlar, raporlar sayfasındaki review bölümü */
export async function getReportedReviews() {
  const pendingReports = await prisma.report.findMany({
    where: { targetType: "REVIEW", status: "PENDING" },
    select: { targetId: true },
  });
  const ids = Array.from(new Set(pendingReports.map((r) => r.targetId)));
  if (ids.length === 0) return [];

  return prisma.review.findMany({
    where: { id: { in: ids } },
    include: {
      user: { select: { id: true, username: true, name: true } },
      recipe: { select: { title: true, slug: true, emoji: true } },
    },
  });
}

/** Raporlanmış uyarlamaları getir (reportCount > 0) */
export async function getFlaggedVariations() {
  return prisma.variation.findMany({
    where: { reportCount: { gt: 0 } },
    include: {
      author: {
        select: { username: true, name: true },
      },
      recipe: {
        select: { title: true, slug: true, emoji: true },
      },
    },
    orderBy: { reportCount: "desc" },
    take: 50,
  });
}

/** Admin istatistikleri */
export async function getAdminStats() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);

  const [
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    pendingVariations,
    pendingReviewsQueue,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    featuredCount,
    reviewAggregate,
    reviewTotal,
    emailVerifiedCount,
    imagelessCount,
    zeroViewCount,
  ] = await Promise.all([
    prisma.recipe.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.variation.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.variation.count({ where: { reportCount: { gt: 0 } } }),
    prisma.variation.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.review.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.bookmark.count(),
    prisma.collection.count(),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: dayStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: weekStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", createdAt: { gte: monthStart } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", averageCalories: { not: null } },
    }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", isFeatured: true },
    }),
    // Review v2: average + count aggregate (sadece PUBLISHED review'lar)
    prisma.review.aggregate({
      where: { status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.count(), // all statuses (PUBLISHED + HIDDEN + PENDING)
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.recipe.count({
      where: { status: "PUBLISHED", imageUrl: null },
    }),
    prisma.recipe.count({ where: { status: "PUBLISHED", viewCount: 0 } }),
  ]);

  const nutritionCoverage = totalRecipes > 0
    ? Number(((nutritionCount / totalRecipes) * 100).toFixed(1))
    : 0;
  const featuredRatio = totalRecipes > 0
    ? Number(((featuredCount / totalRecipes) * 100).toFixed(1))
    : 0;
  const emailVerifiedRatio = totalUsers > 0
    ? Number(((emailVerifiedCount / totalUsers) * 100).toFixed(1))
    : 0;
  const imagelessRatio = totalRecipes > 0
    ? Number(((imagelessCount / totalRecipes) * 100).toFixed(1))
    : 0;

  // Unified "inceleme bekliyor", variation + review preflight kuyrukları
  const pendingQueueTotal = pendingVariations + pendingReviewsQueue;

  return {
    totalRecipes,
    totalUsers,
    totalVariations,
    pendingReports,
    flaggedVariations,
    // Kept for backward-compat; yeni dashboard pendingQueueTotal'ı tercih eder
    pendingReviews: pendingVariations,
    pendingVariations,
    pendingReviewsQueue,
    pendingQueueTotal,
    totalBookmarks,
    totalCollections,
    recipesToday,
    recipesThisWeek,
    recipesThisMonth,
    nutritionCount,
    nutritionCoverage,
    featuredCount,
    featuredRatio,
    // Review v2 stats
    reviewCount: reviewAggregate._count,
    reviewAverage: reviewAggregate._avg.rating
      ? Number(reviewAggregate._avg.rating.toFixed(2))
      : null,
    reviewTotal, // includes hidden/pending, for moderation health
    // User health
    emailVerifiedCount,
    emailVerifiedRatio,
    // Content quality
    imagelessCount,
    imagelessRatio,
    zeroViewCount,
  };
}

/**
 * En aktif kullanıcılar, uyarlama + yorum + bookmark sayıları.
 * Skor: variationCount * 3 + reviewCount * 2 + bookmarkCount * 1 (content
 * üreten kullanıcıya daha yüksek ağırlık). Dashboard leaderboard'u için.
 */
export async function getMostActiveUsers(limit = 10): Promise<
  {
    id: string;
    username: string | null;
    name: string | null;
    role: string;
    variationCount: number;
    reviewCount: number;
    bookmarkCount: number;
    score: number;
  }[]
> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      _count: {
        select: {
          variations: { where: { status: "PUBLISHED" } },
          reviews: { where: { status: "PUBLISHED" } },
          bookmarks: true,
        },
      },
    },
  });

  const scored = users
    .map((u) => {
      const variationCount = u._count.variations;
      const reviewCount = u._count.reviews;
      const bookmarkCount = u._count.bookmarks;
      const score = variationCount * 3 + reviewCount * 2 + bookmarkCount;
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        variationCount,
        reviewCount,
        bookmarkCount,
        score,
      };
    })
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/**
 * En çok raporlanan uyarlamalar (reportCount DESC, sadece >0 olanlar).
 * Admin alarm: hangi içerik tekrar tekrar raporlanıyor, düzenli moderasyon
 * yapılmalı mı kararı.
 */
export async function getMostReportedVariations(limit = 5) {
  return prisma.variation.findMany({
    where: { reportCount: { gt: 0 } },
    orderBy: { reportCount: "desc" },
    take: limit,
    select: {
      id: true,
      miniTitle: true,
      reportCount: true,
      status: true,
      author: { select: { username: true } },
      recipe: { select: { slug: true, title: true } },
    },
  });
}

/**
 * En çok raporlanan yorumlar, Report targetType=REVIEW üzerinden groupBy.
 * Variation'da `reportCount` denormalisation vardı, Review'da yok; bu yüzden
 * report tablosu üzerinden aggregate ediliyor.
 */
export async function getMostReportedReviews(limit = 5): Promise<
  {
    id: string;
    rating: number;
    comment: string | null;
    status: string;
    reportCount: number;
    user: { username: string | null };
    recipe: { slug: string; title: string };
  }[]
> {
  const grouped = await prisma.report.groupBy({
    by: ["targetId"],
    where: { targetType: "REVIEW" },
    _count: true,
    orderBy: { _count: { targetId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.targetId);
  const reviews = await prisma.review.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      rating: true,
      comment: true,
      status: true,
      user: { select: { username: true } },
      recipe: { select: { slug: true, title: true } },
    },
  });

  // Merge report counts onto each review + re-sort (groupBy already
  // sorted but map lookup loses order).
  const countById = new Map(grouped.map((g) => [g.targetId, g._count]));
  return reviews
    .map((r) => ({ ...r, reportCount: countById.get(r.id) ?? 0 }))
    .sort((a, b) => b.reportCount - a.reportCount);
}

// ─── Admin drill-down detail queries ───

// ─── Announcement admin ──────────────────────────────────

export async function getAdminAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      variant: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Aktif duyurular, public layout'ta banner olarak gösterilir.
 * Kurallar:
 *  - startsAt null → hemen geçerli
 *  - endsAt null → süresiz
 *  - startsAt/endsAt her ikisi set ise aradaki pencerede geçerli
 *
 * Defensive: build prerender (CI + lokal) sırasında DATABASE_URL placeholder
 * olabilir ya da migration henüz apply edilmemiş olabilir. Hata fırlarsa
 * banner'sız sessiz dönüyoruz, layout asla patlamamalı.
 */
export async function getActiveAnnouncements() {
  const now = new Date();
  try {
    return await prisma.announcement.findMany({
      where: {
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        variant: true,
      },
    });
  } catch (err) {
    // DB erişimsiz/tablo yok → boş liste. Banner hiç render edilmez,
    // layout asla patlamaz. Build prerender sırasında (NEXT_PHASE set)
    // sessiz geç, her static sayfa için log basmak çıktıyı boğar.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[layout] getActiveAnnouncements skipped: ${msg.slice(0, 120)}`);
    }
    return [];
  }
}

// ─── Collection admin ─────────────────────────────────────

export interface AdminCollectionParams {
  visibility?: "public" | "private" | "hidden"; // filter
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getAdminCollections(params: AdminCollectionParams) {
  const { visibility, search, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = {};
  if (visibility === "public") {
    where.isPublic = true;
    where.hiddenAt = null;
  } else if (visibility === "private") {
    where.isPublic = false;
  } else if (visibility === "hidden") {
    where.hiddenAt = { not: null };
  }
  if (search && search.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        emoji: true,
        isPublic: true,
        hiddenAt: true,
        hiddenReason: true,
        createdAt: true,
        user: { select: { username: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return { collections, total, page, pageSize };
}

// ─── Moderation log ───────────────────────────────────────

export interface ModerationLogParams {
  targetType?: string; // "variation" | "review" | "recipe" | "user"
  action?: string; // "HIDE" | "APPROVE" | "EDIT"
  moderatorId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Moderation action audit trail. createdAt DESC. Filter + pagination.
 * Log kayıtları read-only, kullanıcıya göstermek değil, moderatöre "ne
 * yapıldı" izi bırakmak için. Target bilgisi denormalize saklı değil;
 * target type'a göre ayrıca title çekilir (getModerationLogTargets).
 */
export async function getModerationLog(params: ModerationLogParams) {
  const {
    targetType,
    action,
    moderatorId,
    page = 1,
    pageSize = 50,
  } = params;

  const where: Record<string, unknown> = {};
  if (targetType) where.targetType = targetType;
  if (action) where.action = action;
  if (moderatorId) where.moderatorId = moderatorId;

  const [entries, total] = await Promise.all([
    prisma.moderationAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        moderator: {
          select: { id: true, username: true, name: true, role: true },
        },
      },
    }),
    prisma.moderationAction.count({ where }),
  ]);

  return { entries, total, page, pageSize };
}

/**
 * Log satırlarındaki targetId'lerin title/label'ını toplu çeker, N+1
 * önlemek için. {variation-id: "Fırın versiyonu"} tipi map döner.
 */
export async function getModerationLogTargets(
  entries: { targetType: string; targetId: string }[],
): Promise<Map<string, { label: string; link: string | null }>> {
  const byType = new Map<string, string[]>();
  for (const e of entries) {
    const arr = byType.get(e.targetType) ?? [];
    arr.push(e.targetId);
    byType.set(e.targetType, arr);
  }

  const result = new Map<string, { label: string; link: string | null }>();

  if (byType.has("variation")) {
    const ids = byType.get("variation")!;
    const rows = await prisma.variation.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        miniTitle: true,
        recipe: { select: { slug: true } },
      },
    });
    for (const r of rows) {
      result.set(r.id, {
        label: r.miniTitle,
        link: `/tarif/${r.recipe.slug}`,
      });
    }
  }
  if (byType.has("review")) {
    const ids = byType.get("review")!;
    const rows = await prisma.review.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        rating: true,
        recipe: { select: { slug: true, title: true } },
      },
    });
    for (const r of rows) {
      result.set(r.id, {
        label: `${r.rating}★ · ${r.recipe.title}`,
        link: `/admin/tarifler/${r.recipe.slug}`,
      });
    }
  }
  if (byType.has("recipe")) {
    const ids = byType.get("recipe")!;
    const rows = await prisma.recipe.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, slug: true },
    });
    for (const r of rows) {
      result.set(r.id, {
        label: r.title,
        link: `/admin/tarifler/${r.slug}`,
      });
    }
  }
  if (byType.has("user")) {
    const ids = byType.get("user")!;
    const rows = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, name: true },
    });
    for (const r of rows) {
      result.set(r.id, {
        label: r.name ?? `@${r.username ?? ","}`,
        link: r.username ? `/admin/kullanicilar/${r.username}` : null,
      });
    }
  }

  return result;
}

// ─── Tag & Category admin ─────────────────────────────────

export async function getAdminTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { recipeTags: true } },
    },
  });
}

export async function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      emoji: true,
      description: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      _count: { select: { recipes: true, children: true } },
    },
  });
}

/**
 * Tek kullanıcının tüm admin-görünür verisi. Variation + review listelerinde
 * tüm statüler (HIDDEN + PENDING_REVIEW dahil) gelir, moderatörün o user'ın
 * içerik geçmişini tam görmesi için. Filed reports de dahil (user kimi
 * raporlamış), kullanıcı spam-reporter mı tespit etmek için.
 */
export async function getAdminUserDetail(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      isVerified: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      kvkkAccepted: true,
      kvkkDate: true,
      suspendedAt: true,
      suspendedReason: true,
      _count: {
        select: {
          variations: true,
          reviews: true,
          bookmarks: true,
          reports: true,
          collections: true,
          notifications: true,
        },
      },
    },
  });
  if (!user) return null;

  const [variations, reviews, reportsFiled, badges] = await Promise.all([
    prisma.variation.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        miniTitle: true,
        status: true,
        reportCount: true,
        likeCount: true,
        moderationFlags: true,
        createdAt: true,
        recipe: { select: { slug: true, title: true, emoji: true } },
      },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        moderationFlags: true,
        hiddenReason: true,
        createdAt: true,
        recipe: { select: { slug: true, title: true, emoji: true } },
      },
    }),
    prisma.report.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
      select: {
        key: true,
        awardedAt: true,
      },
    }),
  ]);

  return { user, variations, reviews, reportsFiled, badges };
}

/**
 * Tek tarifin admin-görünür detayı: stats + rating aggregate + distribution
 * + variation + review listeleri. /tarif/[slug] public sayfasının admin
 * gözüyle tam karşılığı, HIDDEN / PENDING_REVIEW içerik dahil.
 */
export async function getAdminRecipeDetail(slug: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      emoji: true,
      description: true,
      difficulty: true,
      status: true,
      type: true,
      isFeatured: true,
      viewCount: true,
      cuisine: true,
      imageUrl: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      allergens: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true, slug: true, emoji: true } },
      _count: {
        select: {
          variations: true,
          reviews: true,
          bookmarks: true,
          ingredients: true,
          steps: true,
        },
      },
    },
  });
  if (!recipe) return null;

  const [reviews, variations, reviewAgg, reviewDist, topBookmarkers] = await Promise.all([
    prisma.review.findMany({
      where: { recipeId: recipe.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        moderationFlags: true,
        hiddenReason: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, name: true, avatarUrl: true },
        },
      },
    }),
    prisma.variation.findMany({
      where: { recipeId: recipe.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        miniTitle: true,
        status: true,
        reportCount: true,
        likeCount: true,
        moderationFlags: true,
        createdAt: true,
        author: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.review.aggregate({
      where: { recipeId: recipe.id, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { recipeId: recipe.id, status: "PUBLISHED" },
      _count: true,
    }),
    prisma.bookmark.findMany({
      where: { recipeId: recipe.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        createdAt: true,
        user: { select: { username: true, name: true } },
      },
    }),
  ]);

  const dist: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  for (const d of reviewDist) {
    const r = d.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) dist[r] = d._count;
  }

  return {
    recipe,
    reviews,
    variations,
    reviewCount: reviewAgg._count,
    reviewAverage: reviewAgg._avg.rating
      ? Number(reviewAgg._avg.rating.toFixed(2))
      : null,
    ratingDistribution: dist,
    topBookmarkers,
  };
}

// ─── Admin list queries (sort + filter + search + pagination) ───

export type RecipeSortKey =
  | "createdAt"
  | "viewCount"
  | "variations"
  | "bookmarks";

export interface AdminRecipeListParams {
  sort?: RecipeSortKey;
  order?: "asc" | "desc";
  status?: string; // "PUBLISHED" | "DRAFT" | "PENDING_REVIEW" | "HIDDEN" | "REJECTED"
  search?: string; // title ilike
  /** Cuisine kodu (tr/it/fr/...). Bos ise hepsi. */
  cuisine?: string;
  /** Category slug. Bos ise hepsi. */
  categorySlug?: string;
  /** Recipe type (YEMEK / CORBA / TATLI / ...). Bos ise hepsi. */
  type?: string;
  /** Sadece featured (true) veya degil (false). Undefined = hepsi. */
  featured?: boolean;
  page?: number; // 1-indexed
  pageSize?: number;
}

export async function getAdminRecipesList(params: AdminRecipeListParams) {
  const {
    sort = "createdAt",
    order = "desc",
    status,
    search,
    cuisine,
    categorySlug,
    type,
    featured,
    page = 1,
    pageSize = 50,
  } = params;

  const where: Record<string, unknown> = {};
  if (status && ["PUBLISHED", "DRAFT", "PENDING_REVIEW", "HIDDEN", "REJECTED"].includes(status)) {
    where.status = status;
  }
  if (search && search.trim()) {
    where.title = { contains: search.trim(), mode: "insensitive" };
  }
  if (cuisine && cuisine.trim()) {
    where.cuisine = cuisine.trim();
  }
  if (categorySlug && categorySlug.trim()) {
    where.category = { slug: categorySlug.trim() };
  }
  if (type && type.trim()) {
    where.type = type.trim();
  }
  if (featured !== undefined) {
    where.isFeatured = featured;
  }

  // Relation counts need `_count` orderBy in Prisma.
  const orderBy =
    sort === "variations"
      ? { variations: { _count: order } }
      : sort === "bookmarks"
        ? { bookmarks: { _count: order } }
        : { [sort]: order };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        emoji: true,
        difficulty: true,
        status: true,
        viewCount: true,
        isFeatured: true,
        createdAt: true,
        category: { select: { name: true } },
        _count: { select: { variations: true, bookmarks: true, reviews: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.recipe.count({ where }),
  ]);

  return { recipes, total, page, pageSize };
}

export type UserSortKey =
  | "createdAt"
  | "variations"
  | "bookmarks"
  | "reports"
  | "reviews";

export interface AdminUserListParams {
  sort?: UserSortKey;
  order?: "asc" | "desc";
  role?: string; // "USER" | "MODERATOR" | "ADMIN"
  verified?: "yes" | "no"; // emailVerified not-null veya null
  search?: string; // name/username/email ilike (ilike any)
  page?: number;
  pageSize?: number;
}

export async function getAdminUsersList(params: AdminUserListParams) {
  const {
    sort = "createdAt",
    order = "desc",
    role,
    verified,
    search,
    page = 1,
    pageSize = 50,
  } = params;

  const where: Record<string, unknown> = {};
  if (role && ["USER", "MODERATOR", "ADMIN"].includes(role)) {
    where.role = role;
  }
  if (verified === "yes") where.emailVerified = { not: null };
  if (verified === "no") where.emailVerified = null;
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "variations"
      ? { variations: { _count: order } }
      : sort === "bookmarks"
        ? { bookmarks: { _count: order } }
        : sort === "reports"
          ? { reports: { _count: order } }
          : sort === "reviews"
            ? { reviews: { _count: order } }
            : { [sort]: order };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            variations: true,
            bookmarks: true,
            reports: true,
            reviews: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}

/**
 * En çok görüntülenen N tarif, editorial/featured karar vermek için.
 * Trendleri anlamak için viewCount DESC, sadece PUBLISHED.
 */
export async function getTopViewedRecipes(
  limit = 5,
): Promise<{ slug: string; title: string; emoji: string | null; viewCount: number; isFeatured: boolean }[]> {
  return prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      emoji: true,
      viewCount: true,
      isFeatured: true,
    },
  });
}

/**
 * Son N kullanıcı kaydı, onboarding akışını izlemek + yeni kullanıcılara
 * hoşgeldin e-maili / incelemesi için fikir verir.
 */
export async function getRecentSignups(
  limit = 10,
): Promise<
  {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    createdAt: Date;
    emailVerified: Date | null;
    role: string;
  }[]
> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      role: true,
    },
  });
}

/**
 * Son N gün günlük signup, user growth bar chart için.
 * Boş günler 0'la doldurulur (chart'ta gap yerine düz bar gözüksün).
 */
export async function getUserGrowthDaily(
  days = 30,
): Promise<{ day: string; count: number }[]> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COUNT(*)::bigint AS count
    FROM users
    WHERE "createdAt" >= ${start}
    GROUP BY day
    ORDER BY day ASC
  `;

  // Fill gaps: API her günü tuttuğu için chart'ta continuous görünür.
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    byDay.set(key, Number(row.count));
  }

  const result: { day: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

/**
 * Review yıldız dağılımı (1-5 yıldız her biri için count).
 * Summary card'da mini bar chart olarak gösterilir.
 */
export async function getReviewDistribution(): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const rows = await prisma.review.groupBy({
    by: ["rating"],
    where: { status: "PUBLISHED" },
    _count: true,
  });

  const dist: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  for (const r of rows) {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      dist[rating] = r._count;
    }
  }
  return dist;
}

/**
 * Son N batch, Recipe.createdAt günleri gruplayıp en yeni N grubu döner.
 * Codex 100 tarif/batch yazıyor, hepsi aynı dakika INSERT'lendiği için
 * "aynı saatte 50+ tarif eklenmiş" tarihler batch sınırlarıdır.
 *
 * 1 saatlik bucket'lar, birden fazla seed run'u aynı gün varsa ayırır.
 */
export async function getRecentBatches(limit = 7): Promise<
  { hour: Date; count: number }[]
> {
  // Postgres date_trunc ile saat bucket'la, count > 5 olanları al
  // (kullanıcı ekleme akışı 1-2 tarif yapabilir, batch 50+ INSERT eder).
  const rows = await prisma.$queryRaw<
    { hour: Date; count: bigint }[]
  >`
    SELECT
      date_trunc('hour', "createdAt") AS hour,
      COUNT(*)::bigint AS count
    FROM recipes
    WHERE status = 'PUBLISHED'
    GROUP BY hour
    HAVING COUNT(*) > 5
    ORDER BY hour DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ hour: r.hour, count: Number(r.count) }));
}

/**
 * Kategori başına tarif sayısı, admin'in "hangi kategori dolu, hangi
 * boş" görüşü. Sortby count desc.
 */
/**
 * Cuisine dağılımı, admin'in mutfak dengesini görmesi.
 */
/** Mutfak dağılımı, cached 15 dk. Yeni tarif seed'i 100'er artışla
 *  geldiği için dakika-level taze olması kritik değil; analytics +
 *  footer/landing chip'leri 15 dk staleness'tan etkilenmez.
 *  `revalidateTag("recipes")` ile invalidate edilir. */
export const getCuisineBreakdown = unstable_cache(
  async (): Promise<
    { code: string; label: string; flag: string; count: number }[]
  > => {
  const rows = await prisma.recipe.groupBy({
    by: ["cuisine"],
    where: { status: "PUBLISHED", cuisine: { not: null } },
    _count: true,
    orderBy: { _count: { cuisine: "desc" } },
  });
  return rows
    .filter((r) => r.cuisine)
    .map((r) => ({
      code: r.cuisine!,
      label: CUISINE_LABEL[r.cuisine as CuisineCode] ?? r.cuisine!,
      flag: CUISINE_FLAG[r.cuisine as CuisineCode] ?? "🌍",
      count: r._count,
    }));
  },
  ["cuisine-breakdown-v1"],
  // Session 11 tune: 15 dk → 30 dk. Admin-only view, 100+ tarif
  // eklenene kadar değişim minor.
  { revalidate: 1800, tags: ["recipes", "cuisine-stats"] },
);

export async function getCategoryBreakdown(): Promise<
  { name: string; emoji: string | null; count: number }[]
> {
  const rows = await prisma.category.findMany({
    select: {
      name: true,
      emoji: true,
      _count: {
        select: { recipes: { where: { status: "PUBLISHED" } } },
      },
    },
  });
  return rows
    .map((r) => ({ name: r.name, emoji: r.emoji, count: r._count.recipes }))
    .sort((a, b) => b.count - a.count);
}

// ── Analytics dashboard helpers ─────────────────────────────────────
//
// Tarifle'nin `/admin/analytics` sayfası tarafından kullanılıyor. Overview
// sayfasındaki `getAdminStats()` genel sayaçları döndürür; bu blok
// topluluk sağlığı göstergelerini (abone, son 7 gün büyüme, en çok yorum /
// kaydedilen tarif) doldurur.

/** Newsletter ACTIVE sub count, double-opt-in confirmed subscribers. */
export async function getActiveNewsletterCount(): Promise<number> {
  return prisma.newsletterSubscription.count({
    where: { status: "ACTIVE" },
  });
}

/**
 * Son N gün (default 7) içinde yayınlanan tarif sayısı. Codex batch promote
 * sonrası grafik olarak "son haftada kaç yeni tarif girdi" görünürlüğü
 * verir.
 */
export async function getRecentRecipeAdditions(days = 7): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return prisma.recipe.count({
    where: { status: "PUBLISHED", createdAt: { gte: since } },
  });
}

/** Son N gün içindeki yeni kullanıcı kaydı sayısı. */
export async function getRecentUserSignupCount(days = 7): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return prisma.user.count({
    where: { createdAt: { gte: since } },
  });
}

/**
 * En çok yorum alan tarifler, Review count group-by. Sadece `PUBLISHED`
 * review'lar sayılır (moderasyondan geçmemiş içerik leaderboard'a giremez).
 * Recipe join ikinci queryde: Prisma groupBy + relational include tek
 * queryde desteklemez, ayrı fetch gerekir.
 */
/** En çok yorum alan tarifler, cached 10 dk. Admin analytics +
 *  potansiyel homepage shelf kullanımı için. Review ekleme/silme
 *  dakika-level taze olmak zorunda değil; `revalidateTag("reviews")`
 *  ile admin moderation sonrası invalidate edilir. */
export const getMostReviewedRecipes = unstable_cache(
  async (
    limit = 10,
  ): Promise<
    { slug: string; title: string; emoji: string | null; reviewCount: number }[]
  > => {
  const grouped = await prisma.review.groupBy({
    by: ["recipeId"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
    orderBy: { _count: { recipeId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: grouped.map((g) => g.recipeId) } },
    select: { id: true, slug: true, title: true, emoji: true },
  });
  const byId = new Map(recipes.map((r) => [r.id, r]));

  return grouped
    .map((g) => {
      const recipe = byId.get(g.recipeId);
      if (!recipe) return null;
      return {
        slug: recipe.slug,
        title: recipe.title,
        emoji: recipe.emoji,
        reviewCount: g._count._all,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  },
  ["most-reviewed-recipes-v1"],
  { revalidate: 600, tags: ["reviews", "recipes"] },
);

/**
 * En çok kaydedilen tarifler, Bookmark group-by. "Kullanıcılar hangi
 * tarifleri dolabına koyuyor" sorusunun cevabı; view'den daha güçlü bir
 * niyet sinyali (görüntüleme ≠ deneme isteği).
 * Cached 10 dk, bookmark ekleme dakika-level taze olmak zorunda değil.
 */
export const getMostSavedRecipes = unstable_cache(
  async (
    limit = 10,
  ): Promise<
    { slug: string; title: string; emoji: string | null; saveCount: number }[]
  > => {
  const grouped = await prisma.bookmark.groupBy({
    by: ["recipeId"],
    _count: { _all: true },
    orderBy: { _count: { recipeId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: grouped.map((g) => g.recipeId) } },
    select: { id: true, slug: true, title: true, emoji: true },
  });
  const byId = new Map(recipes.map((r) => [r.id, r]));

  return grouped
    .map((g) => {
      const recipe = byId.get(g.recipeId);
      if (!recipe) return null;
      return {
        slug: recipe.slug,
        title: recipe.title,
        emoji: recipe.emoji,
        saveCount: g._count._all,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  },
  ["most-saved-recipes-v1"],
  { revalidate: 600, tags: ["bookmarks", "recipes"] },
);

/**
 * Admin tarif icerik duzenleme icin minimal fetch: ingredient + step +
 * tipNote + servingSuggestion. Cache edilmez (admin, her acista taze).
 */
export async function getRecipeForAdminEdit(slug: string) {
  return prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      emoji: true,
      tipNote: true,
      servingSuggestion: true,
      ingredients: {
        orderBy: { sortOrder: "asc" },
        select: { sortOrder: true, name: true, amount: true, unit: true },
      },
      steps: {
        orderBy: { stepNumber: "asc" },
        select: { stepNumber: true, instruction: true, timerSeconds: true },
      },
    },
  });
}
