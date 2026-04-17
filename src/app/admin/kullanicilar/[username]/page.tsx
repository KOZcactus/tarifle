import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/lib/queries/admin";
import { FLAG_LABELS, type PreflightFlag } from "@/lib/moderation/preflight";
import {
  REVIEW_FLAG_LABELS,
  type ReviewPreflightFlag,
} from "@/lib/moderation/preflight-review";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `@${username} | Yönetim Paneli`,
    robots: { index: false, follow: false },
  };
}

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  PROFANITY: "Uygunsuz dil",
  MISLEADING: "Yanıltıcı",
  HARMFUL: "Zararlı",
  OTHER: "Diğer",
};

function statusChip(status: string) {
  if (status === "PUBLISHED") {
    return { label: "Yayında", classes: "bg-accent-green/15 text-accent-green" };
  }
  if (status === "HIDDEN" || status === "REJECTED") {
    return { label: status, classes: "bg-error/15 text-error" };
  }
  if (status === "PENDING_REVIEW") {
    return { label: "İncelemede", classes: "bg-secondary/20 text-secondary" };
  }
  return { label: status, classes: "bg-bg-elevated text-text-muted" };
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { username } = await params;
  const detail = await getAdminUserDetail(username);
  if (!detail) notFound();

  const { user, variations, reviews, reportsFiled, badges } = detail;

  // Composite score identical to dashboard leaderboard
  const score =
    user._count.variations * 3 + user._count.reviews * 2 + user._count.bookmarks;

  const stats = [
    { label: "Uyarlama", value: user._count.variations, emoji: "🔄" },
    { label: "Yorum", value: user._count.reviews, emoji: "⭐" },
    { label: "Bookmark", value: user._count.bookmarks, emoji: "🔖" },
    { label: "Koleksiyon", value: user._count.collections, emoji: "📚" },
    { label: "Rapor Etti", value: user._count.reports, emoji: "🚩" },
    { label: "Bildirim", value: user._count.notifications, emoji: "🔔" },
    { label: "Aktivite Skoru", value: score, emoji: "🏆" },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-text-muted" aria-label="breadcrumb">
        <Link href="/admin/kullanicilar" className="hover:text-primary">
          Kullanıcılar
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-text">@{user.username}</span>
      </nav>

      {/* Header */}
      <header className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
            {(user.name ?? user.username ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-bold text-text">
                {user.name ?? user.username ?? "(anonim)"}
              </h2>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  user.role === "ADMIN"
                    ? "bg-primary/10 text-primary"
                    : user.role === "MODERATOR"
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-bg-elevated text-text-muted"
                }`}
              >
                {user.role}
              </span>
              {user.isVerified && (
                <span className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-xs font-medium text-accent-blue">
                  Tarifle ekibi
                </span>
              )}
              {user.emailVerified && (
                <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
                  ✉ doğrulanmış
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-text-muted">
              @{user.username ?? "—"}
              {user.email && <span className="ml-2">· {user.email}</span>}
            </p>
            {user.bio && <p className="mt-2 text-sm text-text">{user.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              <span>Kayıt: {fmtDate(user.createdAt)}</span>
              {user.emailVerified && (
                <span>E-posta onayı: {fmtDate(user.emailVerified)}</span>
              )}
              {user.kvkkAccepted && user.kvkkDate && (
                <span>KVKK: {fmtDate(user.kvkkDate)}</span>
              )}
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <Link
              href={`/profil/${user.username}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-elevated"
              target="_blank"
              rel="noopener"
            >
              Public profil ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Stats grid */}
      <section>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-bg-card px-3 py-3"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg">
                  {s.emoji}
                </span>
                <div>
                  <p className="text-lg font-bold text-text">
                    {s.value.toLocaleString("tr-TR")}
                  </p>
                  <p className="text-[11px] text-text-muted">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Badges */}
      {badges.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold">
            🏅 Rozetler ({badges.length})
          </h3>
          <ul className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <li
                key={b.key}
                className="rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text"
                title={fmtDate(b.awardedAt)}
              >
                {b.key}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Variations */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          🔄 Uyarlamalar ({variations.length})
        </h3>
        {variations.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz uyarlama eklenmemiş.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <ul className="divide-y divide-border">
              {variations.map((v) => {
                const chip = statusChip(v.status);
                const flags = (v.moderationFlags ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as PreflightFlag[];
                return (
                  <li key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tarif/${v.recipe.slug}`}
                        className="block truncate font-medium text-text hover:text-primary"
                      >
                        {v.miniTitle}
                      </Link>
                      <p className="truncate text-xs text-text-muted">
                        {v.recipe.emoji} {v.recipe.title} · {fmtDate(v.createdAt)}
                      </p>
                      {flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {flags.map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] text-error"
                            >
                              {FLAG_LABELS[f] ?? f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span title="Beğeni" className="text-text-muted">
                        ❤ {v.likeCount}
                      </span>
                      {v.reportCount > 0 && (
                        <span
                          className="rounded-full bg-error/15 px-1.5 py-0.5 text-[10px] font-medium text-error"
                          title="Rapor sayısı"
                        >
                          🚩 {v.reportCount}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chip.classes}`}
                      >
                        {chip.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          ⭐ Yorumlar ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz yorum yazılmamış.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <ul className="divide-y divide-border">
              {reviews.map((r) => {
                const chip = statusChip(r.status);
                const flags = (r.moderationFlags ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as ReviewPreflightFlag[];
                return (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-[#f5a623]">
                        {"★".repeat(r.rating)}
                        <span className="text-text-muted">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                      <Link
                        href={`/tarif/${r.recipe.slug}`}
                        className="min-w-0 flex-1 truncate font-medium text-text hover:text-primary"
                      >
                        {r.recipe.emoji} {r.recipe.title}
                      </Link>
                      <span className="shrink-0 text-xs text-text-muted">
                        {fmtDate(r.createdAt)}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${chip.classes}`}
                      >
                        {chip.label}
                      </span>
                    </div>
                    {r.comment && (
                      <blockquote className="border-l-2 border-border pl-2 text-xs text-text">
                        {r.comment}
                      </blockquote>
                    )}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] text-error"
                          >
                            {REVIEW_FLAG_LABELS[f] ?? f}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.status === "HIDDEN" && r.hiddenReason && (
                      <p className="text-[11px] italic text-text-muted">
                        Gizleme sebebi: {r.hiddenReason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Reports filed */}
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          🚩 Raporları ({reportsFiled.length})
        </h3>
        {reportsFiled.length === 0 ? (
          <p className="text-sm text-text-muted">Rapor oluşturmamış.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
            <ul className="divide-y divide-border">
              {reportsFiled.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-text">
                      <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-muted">
                        {r.targetType}
                      </span>{" "}
                      <span className="font-mono text-xs text-text-muted">
                        {r.targetId.slice(0, 12)}…
                      </span>
                    </p>
                    {r.description && (
                      <p className="mt-1 truncate text-xs text-text-muted">
                        "{r.description}"
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="rounded bg-error/10 px-1.5 py-0.5 text-[10px] text-error">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                      {r.status}
                    </span>
                    <span className="text-text-muted">{fmtDate(r.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
