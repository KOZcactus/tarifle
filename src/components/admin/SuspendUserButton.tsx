"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  suspendUserAction,
  unsuspendUserAction,
} from "@/lib/actions/admin-ops";

interface Props {
  userId: string;
  suspended: boolean;
  /** False ise UI görünmez, ADMIN hesabı bile kendi kendini askıya alamaz. */
  allow: boolean;
}

export function SuspendUserButton({ userId, suspended, allow }: Props) {
  const t = useTranslations("admin.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!allow) return null;

  function suspend() {
    const reason = window.prompt(t("promptSuspendReason"), "");
    if (reason === null) return;
    startTransition(async () => {
      const res = await suspendUserAction({
        userId,
        reason: reason.trim() || undefined,
      });
      if (res.success) router.refresh();
      else alert(res.error ?? t("suspendFailed"));
    });
  }

  function unsuspend() {
    if (!confirm(t("promptUnsuspendConfirm"))) return;
    startTransition(async () => {
      const res = await unsuspendUserAction({ userId });
      if (res.success) router.refresh();
      else alert(res.error ?? t("unsuspendFailed"));
    });
  }

  return suspended ? (
    <button
      type="button"
      onClick={unsuspend}
      disabled={pending}
      className="rounded-lg bg-accent-green/15 px-3 py-1.5 text-xs font-medium text-accent-green hover:bg-accent-green/25 disabled:opacity-50"
    >
      {t("unsuspend")}
    </button>
  ) : (
    <button
      type="button"
      onClick={suspend}
      disabled={pending}
      className="rounded-lg bg-error/15 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/25 disabled:opacity-50"
    >
      {t("suspend")}
    </button>
  );
}
