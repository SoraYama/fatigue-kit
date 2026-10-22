> **Date / Revised**: 2026-10-22 (created) / 2026-10-22 (revised)

# v1.x website and React bindings

## 1. Background & Problem

After the v1 core API freeze, the project needed an English-first documentation product, GitHub Pages deployment, a real-engine playground, and React bindings that do not introduce render-time consumption or Strict Mode ambiguity.

## 2. Root Cause / Approach

The repository now uses npm workspaces incrementally while leaving the core at the root. Astro and Starlight provide static documentation and search; custom Astro pages provide the homepage, changelog, roadmap, and playground. English is canonical and Simplified Chinese mirrors every route.

The React package owns a key-scoped external store and uses `useSyncExternalStore`. Consumption stays explicit: render and mount only call `peek`, while `tryConsume` and `reset` notify same-key subscribers. React and the core remain peer dependencies and are externalized from the bundle.

## 3. Key Changes

- `website/`: Astro/Starlight site with custom light/dark homepage, bilingual docs, changelog, roadmap, and a real `fatigue-kit` playground.
- `.github/workflows/pages.yml`: builds core, React, and website, then deploys the static artifact to GitHub Pages from `main`.
- `packages/react/`: `FatigueProvider`, `useFatigue`, and `useFatigueState`; React 18/19 peer range; Strict Mode and SSR tests.
- `smoke/react.mjs`: packs core and React, verifies externalization and package targets, installs both tarballs into an isolated consumer, and server-renders the provider.
- npm workspaces retain the root package as a workspace (`"."`) so Changesets can version both core and React.

## 4. Conclusions / Lessons

Do not hide frequency consumption in a mount effect. Explicit user actions make behavior predictable under Strict Mode, SSR, remounts, and future concurrent React features. A bindings-owned external store preserves the frozen core API, but direct operations through the raw core instance are intentionally outside React notification guarantees.

For Starlight, locale content paths determine generated URLs and are normalized to lowercase. The unprefixed canonical language must use `locales.root`; configuring it as `en` causes navigation to invent an `/en/` prefix even when output is generated at root. GitHub Pages links must consistently include the configured base path, and generated internal links are validated against `dist/`. Website dependencies remain private and must never enter the core tarball.

The intended scoped package name could not be published because the npm `@fatigue-kit` scope does not exist for the release token (`E404 Scope not found`). The public package was therefore renamed to the available unscoped `fatigue-kit-react`; keep documentation, smoke tests, workspace scripts, and changelog names aligned with this package identity.
