# Contributing to fatigue-kit

Thanks for your interest! This repo is intentionally small and dependency-free; please keep it that way.

## Development

```sh
npm install
npm run test:watch   # vitest
npm run build        # tsup → dist/ (esm + cjs + iife global)
npm run typecheck    # tsc --noEmit
npm run lint         # biome check
npm run format       # biome check --write
npm run size         # size-limit budgets
```

## Ground rules

- **Zero runtime dependencies** in the core package. Adapters talk to platform APIs through tiny injected interfaces; never import an SDK directly.
- **New storage adapters** must implement `SyncStorage` (`get` / `set` / `remove`, optional `keys`), live in `src/adapters/`, get their own subpath export in `package.json`, an entry in `tsup.config.ts`, a row in the README environment table, and tests.
- **Calendar/time logic** must be written with date components (`setDate`, `new Date(y, m, d)`), never `+ 24h` arithmetic — DST safety is a test requirement (CI runs the suite under several `TZ` values).
- **Errors from storage must not crash the host app**; report via the adapter's `onError`.
- Record format changes require a `RECORD_VERSION` bump and a migration note.
- **Docs are bilingual**: `README.md` (English, the npm homepage) and `README.zh-CN.md` (简体中文) must stay in sync — when you change one, update the other.

## Releases

We use [Changesets](https://github.com/changesets/changesets):

```sh
npm run changeset   # after a meaningful change
git commit && push  # CI runs lint + typecheck + tests + build + size
# merging to main opens a "Version Packages" PR; merging it publishes to npm
```

Before the first publish:

1. Set the `NPM_TOKEN` secret in the repo settings (Settings → Secrets and variables → Actions).
2. Enable GitHub Actions.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) keep the history readable; Changesets drive versions, so commit messages are for humans.
