"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  hideCollectionAction,
  unhideCollectionAction,
} from "@/lib/actions/admin-ops";

interface Props {
  collectionId: string;
  hidden: boolean;
}

export function CollectionActions({ collectionId, hidden }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function hide() {
    const reason = window.prompt(
      "İsteğe bağlı: gizleme sebebi (sahibe moderasyon log'unda görünür).",
      "",
    );
    if (reason === null) return;
    startTransition(async () => {
      const res = await hideCollectionAction({
        collectionId,
        reason: reason.trim() || undefined,
      });
      if (res.success) router.refresh();
      else alert(res.error ?? "Gizlenemedi.");
    });
  }

  function unhide() {
    startTransition(async () => {
      const res = await unhideCollectionAction({ collectionId });
      if (res.success) router.refresh();
      else alert(res.error ?? "Geri alınamadı.");
    });
  }

  return hidden ? (
    <button
      type="button"
      onClick={unhide}
      disabled={pending}
      className="rounded-lg bg-accent-green/15 px-3 py-1 text-xs font-medium text-accent-green hover:bg-accent-green/25 disabled:opacity-50"
    >
      Geri aç
    </button>
  ) : (
    <button
      type="button"
      onClick={hide}
      disabled={pending}
      className="rounded-lg bg-error/15 px-3 py-1 text-xs font-medium text-error hover:bg-error/25 disabled:opacity-50"
    >
      Gizle
    </button>
  );
}
