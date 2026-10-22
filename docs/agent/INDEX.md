> **Last updated**: 2026-10-22 (fixed Starlight default-locale sidebar paths and added generated-link validation)

# Agent Knowledge Index

## Research

| Note | Summary |
| --- | --- |
| [2026-10-22-v1x-quality-baseline](research/2026-10-22-v1x-quality-baseline.md) | npm pack consumer boundary: smoke-test ESM, CJS, strict TypeScript, all subpath exports and IIFE; public adapter signatures must re-export WebStorageAdapterOptions; coverage baseline raised to 93/88/92/93 |

## Features

| Note | Summary |
| --- | --- |
| [2026-10-22-v1x-website-react](feature/2026-10-22-v1x-website-react.md) | Astro/Starlight English-first bilingual GitHub Pages website and real-engine playground; fatigue-kit-react uses explicit actions and useSyncExternalStore for Strict Mode-safe, SSR-safe key subscriptions |

## Bug Fixes

| Note | Summary |
| --- | --- |
| [2026-10-22-starlight-sidebar-base-path](bugfix/2026-10-22-starlight-sidebar-base-path.md) | Starlight defaultLocale `en` generated `/fatigue-kit/en/...` sidebar links while static output lived at `/fatigue-kit/...`; use `locales.root` and verify every generated internal href against `dist/` |

## Optimizations

| Note | Summary |
| --- | --- |

## Misc

| Note | Summary |
| --- | --- |
