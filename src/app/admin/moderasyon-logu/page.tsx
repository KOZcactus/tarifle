import Link from "next/link";
import {
  getModerationLog,
  getModerationLogTargets,
  type ModerationLogParams,
} from "@/lib/queries/admin";
import { PaginationBar } from "@/components/admin/PaginationBar";

export const metadata = {
  title: "Moderasyon Logu | Yönetim Paneli",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TARGET_TYPES = ["variation", "review", "recipe", "user"] as const;
const ACTIONS = ["HIDE", "APPROVE", "EDIT"] as const;

const TARGET_LABELS: Record<string, string> = {
  variation: "Uyarlama",
  review: "Yorum",
  recipe: "Tarif",
  user: "Kullanıcı",
};
const ACTION_META: Record<
  string,
  { label: string; classes: string }
> = {
  HIDE: { label: "Gizlendi", classes: "bg-error/15 text-error" },
  APPROVE: { label: "Onaylandı", classes: "bg-accent-green/15 text-accent-green" },
  EDIT: { label: "Düzenlendi", classes: "bg-accent-blue/15 text-accent-blue" },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstStr(
  raw: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(raw)) return raw[0] ?? fallback;
  return raw ?? fallback;
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

export default async function ModerationLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const targetType = firstStr(sp.type);
  const action = firstStr(sp.action);
  const page = Math.max(1, parseInt(firstStr(sp.page, "1"), 10) || 1);

  const params: ModerationLogParams = {
    targetType: targetType || undefined,
    action: action || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { entries, total } = await getModerationLog(params);
  const targets = await getModerationLogTargets(
    entries.map((e) => ({ targetType: e.targetType, targetId: e.targetId })),
  );

  function buildHref(overrides: Record<string, string | number | null>) {
    const out = new URLSearchParams();
    if (targetType) out.set("type", targetType);
    if (action) out.set("action", action);
    if (page > 1) out.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "" || v === 0) out.delete(k);
      else out.set(k, String(v));
    }
    const qs = out.toString();
    return qs ? `/admin/moderasyon-logu?${qs}` : "/admin/moderasyon-logu";
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          Moderasyon Logu ({total.toLocaleString("tr-TR")})
        </h2>
      </div>

      {/* Filter form (GET) */}
      <form
        method="get"
        action="/admin/moderasyon-logu"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <select
          name="type"
          defaultValue={targetType}
          aria-label="Hedef türü"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm hedefler</option>
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>
              {TARGET_LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={action}
          aria-label="İşlem"
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm işlemler</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_META[a]?.label ?? a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Uygula
        </button>
        {(targetType || action) && (
          <Link
            href="/admin/moderasyon-logu"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
          >
            Temizle
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-text-muted">
          Bu filtrelerde log kaydı yok.
        </p>
      ) : (
        <ol className="divide-y divide-border rounded-xl border border-border bg-bg-card">
          {entries.map((e) => {
            const meta = ACTION_META[e.action] ?? {
              label: e.action,
              classes: "bg-bg-elevated text-text-muted",
            };
            const target = targets.get(e.targetId);
            return (
              <li key={e.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.classes}`}
                  >
                    {meta.label}
                  </span>
                  <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-muted">
                    {TARGET_LABELS[e.targetType] ?? e.targetType}
                  </span>
                  {target ? (
                    target.link ? (
                      <Link
                        href={target.link}
                        className="min-w-0 flex-1 truncate font-medium text-text hover:text-primary"
                      >
                        {target.label}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate font-medium text-text">
                        {target.label}
                      </span>
                    )
                  ) : (
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-muted">
                      {e.targetId.slice(0, 16)}… <span className="italic">(silinmiş)</span>
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-text-muted">
                    {fmtDate(e.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-text-muted">
                    Moderator:{" "}
                    {e.moderator.username ? (
                      <Link
                        href={`/admin/kullanicilar/${e.moderator.username}`}
                        className="text-text hover:text-primary"
                      >
                        {e.moderator.name ?? `@${e.moderator.username}`}
                      </Link>
                    ) : (
                      e.moderator.name ?? e.moderator.id.slice(0, 8)
                    )}
                    <span className="ml-2 rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                      {e.moderator.role}
                    </span>
                  </span>
                </div>
                {e.reason && (
                  <p className="mt-1 text-xs italic text-text-muted">
                    {e.reason}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <PaginationBar
        currentPage={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        buildHref={(p) => buildHref({ page: p === 1 ? null : p })}
      />
    </div>
  );
}
