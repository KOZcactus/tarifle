/**
 * Leaderboard skor hesaplama. Faz 1 ücretsiz tier, real-time hesap +
 * unstable_cache 15 dk TTL. User sayısı 5000+ olunca snapshot tabanlı
 * v2'ye geçilir (`UserScoreSnapshot` model, haftalık materialize).
 *
 * Skor algoritması (docs/TARIFLE_ULTIMATE_PLAN.md §35):
 *   skor = uyarlama_sayısı × 3
 *        + toplam_beğeni × 1
 *        + review_rating_toplam × 2
 *        + fotoğraf_sayısı × 2
 *        + topluluk_seçimi (editör bonus) × 10
 *
 * Pencereler:
 *   - WEEKLY: son 7 gün (pazartesi 00:00 UTC başlangıç)
 *   - MONTHLY: son 30 gün (ayın 1'i 00:00 UTC başlangıç)
 *   - ALL_TIME: kullanıcı kayıt tarihi ile bugün arası tüm aktivite
 *
 * Filtering: sadece moderator-approved (status=PUBLISHED) varyasyonlar
 * sayılır; PENDING_REVIEW veya HIDDEN skor üretmez. Bu fake hesap
 * gaming'i kısmen filtreler (1 hafta moderator bekleme penceresi).
 */
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type ScorePeriod = "WEEKLY" | "MONTHLY" | "ALL_TIME";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  score: number;
  variationCount: number;
  likeCount: number;
  photoCount: number;
  reviewRatingSum: number;
  editorChoiceCount: number;
}

/**
 * Pencere başlangıç tarihini hesapla. WEEKLY = bu haftanın pazartesi
 * 00:00 UTC, MONTHLY = bu ayın 1'i 00:00 UTC, ALL_TIME = Unix epoch 0.
 */
function getPeriodStart(period: ScorePeriod, reference: Date = new Date()): Date {
  if (period === "ALL_TIME") return new Date(0);

  const d = new Date(reference);
  d.setUTCHours(0, 0, 0, 0);

  if (period === "WEEKLY") {
    // getUTCDay: 0 = Sunday, 1 = Monday. Pazartesi = 1.
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // Sunday -> geri 6 gün, diğer günler Monday'e kadar
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
  }

  if (period === "MONTHLY") {
    d.setUTCDate(1);
    return d;
  }

  return new Date(0);
}

/**
 * Top N kullanıcı + skorları. Period filtreli. Real-time aggregation.
 */
async function _computeLeaderboard(
  period: ScorePeriod,
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  const since = getPeriodStart(period);

  // Raw SQL aggregate: tek query'de user-level metric toplama.
  // 5 JOIN + GROUP BY; Prisma `findMany`+`include` N+1 üretirdi.
  // `moderator_approved_variations` subquery ile PENDING_REVIEW'daki
  // fake'ler hariç. PostgreSQL performans OK < 10k user.
  const rows = await prisma.$queryRaw<
    {
      userId: string;
      username: string;
      name: string | null;
      avatarUrl: string | null;
      variationCount: bigint;
      likeCount: bigint;
      photoCount: bigint;
      reviewRatingSum: bigint;
      editorChoiceCount: bigint;
      score: bigint;
    }[]
  >`
    WITH
      user_vars AS (
        SELECT v."authorId" AS user_id,
               COUNT(*) AS variation_count
        FROM variations v
        WHERE v.status = 'PUBLISHED'
          AND v."createdAt" >= ${since}
        GROUP BY v."authorId"
      ),
      user_likes AS (
        SELECT v."authorId" AS user_id,
               COUNT(l.id) AS like_count
        FROM variations v
        LEFT JOIN likes l ON l."variationId" = v.id AND l."createdAt" >= ${since}
        WHERE v.status = 'PUBLISHED'
        GROUP BY v."authorId"
      ),
      user_photos AS (
        SELECT p."userId" AS user_id,
               COUNT(*) AS photo_count
        FROM recipe_photos p
        WHERE p.status = 'VISIBLE'
          AND p."createdAt" >= ${since}
          AND p."userId" IS NOT NULL
        GROUP BY p."userId"
      ),
      user_reviews AS (
        SELECT r."userId" AS user_id,
               COALESCE(SUM(r.rating), 0) AS review_rating_sum
        FROM reviews r
        WHERE r.status = 'PUBLISHED'
          AND r."createdAt" >= ${since}
        GROUP BY r."userId"
      ),
      user_editor_badges AS (
        SELECT "userId" AS user_id,
               COUNT(*) AS editor_choice_count
        FROM user_badges
        WHERE key = 'EDITOR_CHOICE'
        GROUP BY "userId"
      ),
      combined AS (
        SELECT u.id AS "userId",
               u.username,
               u.name,
               u."avatarUrl",
               COALESCE(uv.variation_count, 0) AS "variationCount",
               COALESCE(ul.like_count, 0) AS "likeCount",
               COALESCE(up.photo_count, 0) AS "photoCount",
               COALESCE(ur.review_rating_sum, 0) AS "reviewRatingSum",
               COALESCE(ueb.editor_choice_count, 0) AS "editorChoiceCount"
        FROM users u
        LEFT JOIN user_vars uv ON uv.user_id = u.id
        LEFT JOIN user_likes ul ON ul.user_id = u.id
        LEFT JOIN user_photos up ON up.user_id = u.id
        LEFT JOIN user_reviews ur ON ur.user_id = u.id
        LEFT JOIN user_editor_badges ueb ON ueb.user_id = u.id
        WHERE u."deletedAt" IS NULL
          AND u."suspendedAt" IS NULL
      )
    SELECT "userId", username, name, "avatarUrl",
           "variationCount", "likeCount", "photoCount",
           "reviewRatingSum", "editorChoiceCount",
           ("variationCount" * 3
             + "likeCount" * 1
             + "reviewRatingSum" * 2
             + "photoCount" * 2
             + "editorChoiceCount" * 10) AS score
    FROM combined
    WHERE ("variationCount" + "likeCount" + "photoCount" + "reviewRatingSum") > 0
    ORDER BY score DESC, username ASC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    userId: r.userId,
    username: r.username,
    name: r.name,
    avatarUrl: r.avatarUrl,
    variationCount: Number(r.variationCount),
    likeCount: Number(r.likeCount),
    photoCount: Number(r.photoCount),
    reviewRatingSum: Number(r.reviewRatingSum),
    editorChoiceCount: Number(r.editorChoiceCount),
    score: Number(r.score),
  }));
}

/**
 * Cached leaderboard fetcher. 15 dk TTL. Period ve limit key'e dahil.
 * "leaderboard" tag yeni uyarlama/like event'lerinde invalidate
 * edilebilir (opsiyonel; TTL doğal refresh yeterli).
 */
export const getLeaderboard = unstable_cache(
  _computeLeaderboard,
  ["leaderboard-v1"],
  { revalidate: 900, tags: ["leaderboard"] },
);

/**
 * Tek kullanıcının skoru (profil sayfasında "12 uyarlama · 89 beğeni ·
 * 3 rozet" satırı için). ALL_TIME penceresi kullanılır.
 */
export async function getUserScore(userId: string): Promise<{
  score: number;
  variationCount: number;
  likeCount: number;
  photoCount: number;
  badgeCount: number;
}> {
  const [variationCount, likeCount, photoCount, badgeCount, reviewAgg] =
    await Promise.all([
      prisma.variation.count({
        where: { authorId: userId, status: "PUBLISHED" },
      }),
      prisma.like.count({
        where: { variation: { authorId: userId, status: "PUBLISHED" } },
      }),
      prisma.recipePhoto.count({
        where: { userId, status: "VISIBLE" },
      }),
      prisma.userBadge.count({ where: { userId } }),
      prisma.review.aggregate({
        where: { userId, status: "PUBLISHED" },
        _sum: { rating: true },
      }),
    ]);

  // Editor choice bonus: UserBadge EDITOR_CHOICE rozet sayısı. Variation
  // tablosunda boolean flag yok (v1); v2'de `isCommunityPick` eklenebilir.
  const editorChoiceCount = await prisma.userBadge.count({
    where: { userId, key: "EDITOR_CHOICE" },
  });

  const reviewRatingSum = reviewAgg._sum.rating ?? 0;
  const score =
    variationCount * 3 +
    likeCount * 1 +
    reviewRatingSum * 2 +
    photoCount * 2 +
    editorChoiceCount * 10;

  return { score, variationCount, likeCount, photoCount, badgeCount };
}
