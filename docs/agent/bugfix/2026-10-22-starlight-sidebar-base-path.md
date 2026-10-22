> **Date / Revised**: 2026-10-22

# Starlight sidebar base-path 404

## 1. Background & Problem

The deployed documentation page existed at `/fatigue-kit/docs/`, but every Starlight sidebar item navigated to a 404 such as `/fatigue-kit/en/docs/quick-start/`. Project links similarly pointed at `/fatigue-kit/en/changelog/`, while generated files had no `/en/` directory.

## 2. Root Cause / Approach

Starlight was configured with `defaultLocale: 'en'` and an `en` locale. In multilingual mode, Starlight therefore localized navigation links with an `/en/` prefix even though English content was intentionally emitted at root paths. The route content and navigation locale model disagreed.

Configure the canonical language as Starlight's `root` locale and keep Simplified Chinese under the explicit lowercase `zh-cn` route. Sidebar links can then remain route-relative (`/docs/...`, `/changelog/`, etc.) and Starlight combines them with Astro's `/fatigue-kit` base without adding `/en`.

## 3. Key Changes

- `website/astro.config.mjs`: changed the canonical locale to `root`, aligned the Chinese locale key with the generated `zh-cn` directory, and listed Guides/API entries explicitly so every page is visible in the sidebar.
- `website/scripts/check-links.mjs`: scans generated HTML and fails when an internal page link has no corresponding static output.
- `website/package.json`: runs the internal-link check after every production build.

## 4. Conclusions / Lessons

For a multilingual Starlight site whose default language has no URL prefix, use `locales.root`; do not name the default locale `en`. Always inspect generated sidebar hrefs against the actual `dist/` tree. A successful Astro build does not guarantee that configured navigation paths exist, so static internal-link validation belongs in the build gate.
