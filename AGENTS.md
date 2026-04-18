<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Neon branch safety

Tarifle'nin iki Neon branch'i var: **production** (tarifle.app canlı) ve **dev** (lokal + Vercel Preview). Lokal `.env.local` default olarak dev'e bakar. Destructive scriptler (`seed-recipes`, `fix-*`, `retrofit-*`, `rollback-batch`, `sync-*`, `patch-source-from-db`) `scripts/lib/db-env.ts` guard'ı kullanır:

- dev host (`ep-dry-bread-...`) → info banner + devam
- prod host (`ep-broad-pond-...`) **+ `--confirm-prod` YOK** → script durur (exit 1)
- prod host + `--confirm-prod` → 3 saniye uyarı banner + devam

Prod promotion prosedürü: `docs/PROD_PROMOTE.md`. Bir agent olarak prod'a yazma komutlarını ASLA kendi başına koşma; Kerem'in açık onayı olmadan prod host için `--confirm-prod` ekleme.

# Pre-push lint hook

Repo'da versiyonlu bir pre-push hook var (`scripts/git-hooks/pre-push`) — push'tan önce `npm run lint` koşar, error varsa push'u bloklar. CI'ın lint adımıyla aynı disiplin, yerelde yakalar.

Her klon/fresh checkout sonrası tek sefer aktifleştir:

```sh
npm run setup:hooks
```

Acil bypass (sadece gerçekten gerekliyse): `git push --no-verify`. Detay: `scripts/git-hooks/README.md`.
