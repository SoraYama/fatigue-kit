---
title: 自然周期限制
description: 按本地日、周、月或年限制次数。
---

```ts
{ max: 2, every: 'month' }
```

自然周期规则按设备本地时间的 `day`、`week`、`month`、`year` 分组。边界由本地日期分量构造，夏令时不会把边界变成“午夜加 24 小时”。

默认边界为本地午夜，周默认从周一开始。可用 `cutoff` 和 `weekStartsOn` 调整。设备时钟或时区变化可能改变当前周期。