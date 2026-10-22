---
title: Web
description: Persistent and per-tab browser storage.
---

Use `localStorageAdapter()` for persistence across browser sessions or `sessionStorageAdapter()` for a tab-scoped session.

```ts
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'

const fatigue = createFatigue({ storage: localStorageAdapter() })
```

Storage globals are resolved lazily. Quota, security and private-mode failures call `onError` (a warning by default) instead of crashing. Such failed reads look empty and failed writes are not durable. Browser contexts are not transactionally coordinated; cross-tab races are last-write-wins.