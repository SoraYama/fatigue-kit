---
title: 自定义存储
description: 实现同步存储契约。
---

```ts
const storage: SyncStorage = {
  get: (key) => backend.get(key) ?? null,
  set: (key, value) => backend.set(key, value),
  remove: (key) => backend.delete(key),
  keys: () => [...backend.keys()], // 可选
}
```

方法必须同步并存储字符串。实现 `keys()` 后才能无参数调用 `reset()`；`reset(key)` 不要求它。核心不会捕获自定义适配器异常，宿主不能抛错时需自行捕获并上报。

原子性只覆盖单个同步引擎调用。共享后端若跨上下文使用，需要自己的事务或锁策略。