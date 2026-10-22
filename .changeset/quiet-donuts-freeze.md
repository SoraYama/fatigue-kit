---
'fatigue-kit': major
---

**1.0.0 — API freeze.** The public surface (core methods, rule DSL, `ConsumeResult`, adapter contracts) is reviewed and frozen; no breaking changes in this release. Additions: coverage report in CI (`vitest --coverage`), README badges, and documentation for three previously implicit details — `remaining` is `Infinity` when no count-based rule applies, `deniedBy` is the identical rule object you passed in (match with `===`), and custom `SyncStorage` implementations own their error handling.
