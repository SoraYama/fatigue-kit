---
title: Custom storage
description: Implement the synchronous storage contract.
---

```ts
import type { SyncStorage } from 'fatigue-kit'

const storage: SyncStorage = {
  get: (key) => backend.get(key) ?? null,
  set: (key, value) => backend.set(key, value),
  remove: (key) => backend.delete(key),
  keys: () => [...backend.keys()], // optional
}
```

Methods must be synchronous and store strings. Implement `keys()` to support unkeyed `reset()`; keyed reset works without it. The core does not catch custom adapter exceptions, so catch/report backend failures if host code must not throw.

Atomicity covers one synchronous engine call only. A custom shared backend needs its own cross-context transaction or locking strategy.