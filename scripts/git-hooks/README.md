# Git Hooks

Committed hooks that run locally before destructive git operations. Activated
via `git config core.hooksPath scripts/git-hooks`, run `npm run setup:hooks`
once per clone.

## Hooks

### `pre-push`

Blocks `git push` if `npm run lint` reports errors. CI's lint step fails the
whole pipeline, so catching it locally saves a round trip.

Bypass in emergencies (hotfix, docs-only change where you're certain):

```sh
git push --no-verify
```

## Why not husky?

Husky adds a dev dependency and a `.husky/` directory full of wrapper scripts.
For a single hook, native git + one line of config is simpler and has no
install-time side effects.

## CI compatibility

CI never runs these hooks (it pushes nothing), so `core.hooksPath` has no
effect there. The config is local to each clone.
