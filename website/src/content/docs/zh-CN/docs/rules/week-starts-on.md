---
title: 每周起始日
description: 配置每周自然周期的第一天。
---

```ts
{ max: 2, every: 'week', weekStartsOn: 0 } // 周日
```

`weekStartsOn` 使用 JavaScript 星期编号：`0` 为周日，`6` 为周六；默认 `1`（周一）。它只影响 `every: 'week'`。

若同时指定 `cutoff`，每周边界是设备本地时间中该星期的截止时刻。