> **Date / Revised**: 2026-10-22

# v1.x quality baseline

## 1. Background & Problem

`fatigue-kit@1.0.0` had a frozen API and passing source-level tests, but CI did not exercise the actual npm tarball. The published-artifact boundary therefore lacked checks for ESM, CommonJS, declaration files, subpath exports, and the browser IIFE. The design document also still marked v1.0 as pending, and coverage had no regression thresholds.

## 2. Root Cause / Approach

Source tests import `src/` directly, so they cannot catch missing files in `npm pack`, broken conditional exports, declaration bundling issues, or global bundle regressions. A standalone `smoke/run.mjs` now builds and packs the package, installs the tarball into an isolated temporary consumer, then tests every public entry as a consumer would.

Coverage was measured before adding thresholds. Meaningful adapter failure-path tests raised the baseline from 88.16% statements / 86.82% branches / 88.65% functions / 87.78% lines to 93.27% / 88.17% / 92.78% / 93.12%. Thresholds are deliberately set to the rounded-down achieved baseline rather than an aspirational number that would encourage low-value tests.

## 3. Key Changes

- `smoke/run.mjs`: validates tarball contents and every `exports` target; executes ESM, CJS, strict TypeScript, and IIFE consumer checks.
- `src/adapters/local-storage.ts` and `src/adapters/session-storage.ts`: publicly re-export `WebStorageAdapterOptions`. The smoke build exposed rollup-plugin-dts warnings because this public function parameter type previously lived only in a private shared declaration chunk.
- `test/adapters.test.ts`: covers WeChat/Alipay client failures, async backend failures, file-adapter corrupt JSON recovery, key enumeration, removal, and pretty output.
- `vitest.config.ts`: locks coverage at statements 93, branches 88, functions 92, lines 93.
- `.github/workflows/ci.yml`: adds an isolated packed-package smoke job.
- `README.md`, `README.zh-CN.md`, and `docs/design.zh-CN.md`: correct the missing `memoryAdapter` example import, mark v1.0 complete, and publish the approved Now/Next/Exploring/Later roadmap.

## 4. Conclusions / Lessons

For library releases, `npm pack` is the real integration boundary; a successful source build is insufficient. Any new export must be exercised from an installed tarball in ESM, CJS, and TypeScript. Public function signatures must also re-export their named parameter types from the same public subpath, otherwise declaration bundlers may leave consumers dependent on private generated chunks.

Raise coverage thresholds only after adding behavior-oriented tests. Keep website and React work blocked until this quality baseline is stable.
