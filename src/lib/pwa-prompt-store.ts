/**
 * Paylasilan beforeinstallprompt store (oturum 21).
 *
 * `beforeinstallprompt` event browser tarafindan tek seferde fire edilir;
 * birden fazla component bunu yakalamak isteyebilir (banner + profil
 * "Uygulamayi Yukle" butonu). Banner event'i preventDefault edip burada
 * stash eder, profil card store'dan okur.
 *
 * Subscribe pattern: React `useSyncExternalStore` ile uyumlu.
 */

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let storedPrompt: BeforeInstallPromptEventLike | null = null;
const subscribers = new Set<() => void>();

export function setStoredPrompt(p: BeforeInstallPromptEventLike | null): void {
  storedPrompt = p;
  for (const cb of subscribers) cb();
}

export function getStoredPrompt(): BeforeInstallPromptEventLike | null {
  return storedPrompt;
}

export function subscribePromptStore(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
