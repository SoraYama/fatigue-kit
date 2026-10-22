---
title: Web
description: 浏览器持久存储与标签页会话存储。
---

跨浏览器会话持久化使用 `localStorageAdapter()`；单标签页会话使用 `sessionStorageAdapter()`。

```ts
const fatigue = createFatigue({ storage: localStorageAdapter() })
```

存储全局变量会延迟解析。配额、安全策略、隐私模式错误不会让页面崩溃，而会调用 `onError`（默认警告）；失败读取视为空，失败写入不持久。浏览器上下文间没有事务协调，跨标签页竞争采用最后写入获胜。