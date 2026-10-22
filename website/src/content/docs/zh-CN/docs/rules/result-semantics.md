---
title: 返回结果语义
description: 理解 allowed、remaining、nextAvailableAt 与 deniedBy。
---

`peek` 和 `tryConsume` 均返回 `ConsumeResult`。

- `allowed`：当前是否所有规则都允许消耗。
- `remaining`：最严格的次数余量。放行的 `tryConsume` 返回**消耗后**余量，`0` 表示本次用掉最后名额；`peek` 返回当前状态。
- `nextAvailableAt`：所有时间阻塞都解除的最晚毫秒时间戳；放行时及生命周期耗尽时不存在。
- `deniedBy`：输入顺序中首个拒绝规则，保留对象引用。

仅冷却规则时为 `Infinity`，JSON 会把它序列化为 `null`；如需区分应先转换。