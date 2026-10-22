> **Date / Revised**: 2026-10-22

# v1.x completion quality gates

## 1. Background & Problem

The v1.x product was published, but the original Definition of Done still lacked full bilingual topic coverage, a complete v1 playground, React 18 proof, browser E2E, automated accessibility checks, Lighthouse thresholds, and translation parity validation.

## 2. Root Cause / Approach

Close the gap with consumer-level quality gates rather than relying on declarations. Documentation is paired by relative path. Playground state is modeled as a versioned serializable configuration. React 18 and 19 are installed into isolated tarball consumers. Playwright exercises desktop and mobile production-base routes with axe checks. Lighthouse runs against the static build through a dependency-free local server.

## 3. Key Changes

- `website/src/content/docs/`: expanded to 40 English and 40 Simplified Chinese pages covering concepts, every rule primitive, platforms, operations, React, compatibility and release policy.
- `website/src/lib/playground.ts`: versioned share schema, validation, all v1 rule conversion and generated TypeScript.
- `website/src/components/Playground.tsx`: calendar day/week/month/year, cutoff, week start, sliding window, cooldown, lifetime, arbitrary time, record import/export, denial details and share restoration.
- `website/test/e2e/site.spec.ts`: navigation, locale switching, playground sharing, keyboard focus and axe checks on desktop/mobile.
- `website/scripts/check-i18n.mjs`: en/zh-CN path parity and frontmatter validation.
- `website/scripts/lighthouse.mjs`: Performance ≥ 90, Accessibility/Best Practices/SEO ≥ 95, CLS ≤ 0.1 and LCP ≤ 2.5s.
- `smoke/react-matrix.mjs`: isolated packed-package consumers for React 18 and 19.
- CI now runs the React matrix, website unit tests, Playwright, axe and Lighthouse before Pages deployment.

## 4. Conclusions / Lessons

A peer dependency range is not compatibility proof; install and render each supported major in isolation. Static builds and link checks do not cover interaction, mobile navigation or accessibility. Keep playground serialization versioned and sanitize all URL-derived state. Avoid old Lighthouse CI dependency trees when a current Lighthouse CLI plus a small assertion script provides the required gate without audit vulnerabilities.
