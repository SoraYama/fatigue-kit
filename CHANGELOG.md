# fatigue-kit

## 0.2.1

### Patch Changes

- [#6](https://github.com/SoraYama/fatigue-kit/pull/6) [`b666db6`](https://github.com/SoraYama/fatigue-kit/commit/b666db63b83613b531281fdf515323a360d78a6b) Thanks [@SoraYama](https://github.com/SoraYama)! - Toolchain refresh: TypeScript 6 (see PR notes for why not 7 yet), vitest 5, tsup 9, size-limit 14 (rolldown engine) and Changesets CLI 3 with changesets/action v2. Rebuilt output is slightly smaller (core 2.17 kB → 2.06 kB). No API changes.

## 0.2.0

### Minor Changes

- [`6c65d0a`](https://github.com/SoraYama/fatigue-kit/commit/6c65d0a1f4a597b661a16392e425e73f47cddc0a) Thanks [@SoraYama](https://github.com/SoraYama)! - Initial public release: sync atomic core (`tryConsume`/`peek`) with composable sliding-window, calendar, cooldown and lifetime rules; on-demand storage adapters for Web, mini-programs (WeChat/Alipay), React Native and Node.js; injectable clock; versioned self-pruning records; legacy `{times,date,duration,todayCount}` migration helper.
