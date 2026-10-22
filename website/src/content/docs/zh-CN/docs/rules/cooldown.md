---
title: 冷却期
description: 约束相邻两次命中的最短间隔。
---

```ts
{ cooldown: '4h' }
```

首次命中可通过，此后距最近命中必须至少经过指定时长。拒绝时，`nextAvailableAt` 等于 `lastHit + cooldown`。

冷却期不是次数限制，因此只含冷却规则时 `remaining` 为 `Infinity`。若同时需要间隔和额度，请组合次数规则。