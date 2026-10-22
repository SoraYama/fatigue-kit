---
title: React Native
description: 通过已水合缓存连接异步存储。
---

```ts
const handle = asyncStorageAdapter(AsyncStorage)
await handle.ready
const fatigue = createFatigue({ storage: handle.storage })
```

同步引擎读取内存缓存，适配器批量写回异步后端。创建或使用引擎前必须等待 `ready`。`AppState` 进入 `background` 时调用 `await handle.flush()`，避免应用终止导致待写数据丢失。

自定义 `namespace` 时，适配器和 `createFatigue` 必须一致。后端失败会调用 `onError`；写入仍在内存中，但可能未持久化。