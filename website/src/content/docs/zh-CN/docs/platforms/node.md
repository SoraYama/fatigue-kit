---
title: Node.js
description: 将记录持久化到本地 JSON 文件。
---

```ts
const fatigue = createFatigue({ storage: fileAdapter('./data/fatigue.json') })
```

Node 18+ 适配器缓存一个 JSON 对象，并通过临时文件加重命名写入；父目录自动创建。文件缺失或无效时从空状态开始，写入错误调用 `onError`。

它不会协调多个进程或指向同一文件的多个独立适配器。需要并发一致性时，请使用外部锁或具备事务能力的自定义存储。