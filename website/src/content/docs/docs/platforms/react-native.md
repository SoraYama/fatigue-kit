---
title: React Native
description: Bridge asynchronous storage through a hydrated cache.
---

```ts
const handle = asyncStorageAdapter(AsyncStorage)
await handle.ready
const fatigue = createFatigue({ storage: handle.storage })
```

The synchronous engine reads an in-memory cache while the adapter batches writes to the async backend. Always await `ready` before creating or using the engine. Call `await handle.flush()` when `AppState` enters `background` so pending writes survive termination.

If you set `namespace`, pass the identical value to both the adapter and `createFatigue`. Backend failures call `onError`; writes remain in memory but may not persist.