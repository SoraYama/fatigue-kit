---
title: 组合规则
description: 以 AND 语义组合约束。
---

```ts
const rules = [
  { max: 1, every: 'day' },
  { max: 3, window: '7d' },
  { cooldown: '4h' },
]
```

所有规则都必须放行。`tryConsume` 仅在整组规则通过后写入一条共享命中；拒绝不会消耗。`remaining` 是次数规则中的最小余量，`nextAvailableAt` 是最晚的阻塞时间。

`deniedBy` 是输入顺序中首个拒绝规则，并保留调用方传入对象的引用。