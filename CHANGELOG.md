# fatigue-kit

## 1.0.2

### Patch Changes

- [#19](https://github.com/SoraYama/fatigue-kit/pull/19) [`ee37cdf`](https://github.com/SoraYama/fatigue-kit/commit/ee37cdf9743ee4d1ceac9b427160696b0a1cd11e) Thanks [@SoraYama](https://github.com/SoraYama)! - Improve package discovery and onboarding with a React package README, focused keywords, direct documentation links, and explicit persistence and single-context frequency-capping boundaries.

## 1.0.1

### Patch Changes

- [#10](https://github.com/SoraYama/fatigue-kit/pull/10) [`79759ad`](https://github.com/SoraYama/fatigue-kit/commit/79759ade66658684db6b36d28b7c3727d7018979) Thanks [@SoraYama](https://github.com/SoraYama)! - Re-export `WebStorageAdapterOptions` from the local-storage and session-storage public subpaths so TypeScript consumers do not depend on a private generated declaration chunk.

## 1.0.0

### Major Changes

- [#8](https://github.com/SoraYama/fatigue-kit/pull/8) [`d8bda5d`](https://github.com/SoraYama/fatigue-kit/commit/d8bda5de5429add008ad20ac4b9c62adbf2e738d) Thanks [@SoraYama](https://github.com/SoraYama)! - **1.0.0 — API freeze.** The public surface (core methods, rule DSL, `ConsumeResult`, adapter contracts) is reviewed and frozen; no breaking changes in this release. Additions: coverage report in CI (`vitest --coverage`), README badges, and documentation for three previously implicit details — `remaining` is `Infinity` when no count-based rule applies, `deniedBy` is the identical rule object you passed in (match with `===`), and custom `SyncStorage` implementations own their error handling.

## 0.2.1

### Patch Changes

- [#6](https://github.com/SoraYama/fatigue-kit/pull/6) [`b666db6`](https://github.com/SoraYama/fatigue-kit/commit/b666db63b83613b531281fdf515323a360d78a6b) Thanks [@SoraYama](https://github.com/SoraYama)! - Toolchain refresh: TypeScript 6 (see PR notes for why not 7 yet), vitest 5, tsup 9, size-limit 14 (rolldown engine) and Changesets CLI 3 with changesets/action v2. Rebuilt output is slightly smaller (core 2.17 kB → 2.06 kB). No API changes.

## 0.2.0

### Minor Changes

- [`6c65d0a`](https://github.com/SoraYama/fatigue-kit/commit/6c65d0a1f4a597b661a16392e425e73f47cddc0a) Thanks [@SoraYama](https://github.com/SoraYama)! - Initial public release: sync atomic core (`tryConsume`/`peek`) with composable sliding-window, calendar, cooldown and lifetime rules; on-demand storage adapters for Web, mini-programs (WeChat/Alipay), React Native and Node.js; injectable clock; versioned self-pruning records; legacy `{times,date,duration,todayCount}` migration helper.
