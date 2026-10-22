---
title: 中英术语表
description: fatigue-kit 文档中的英文与简体中文术语。
---

| English | 简体中文 | 含义 |
| --- | --- | --- |
| frequency capping | 频次控制 / 疲劳度控制 | 限制体验发生频率 |
| key | 键 / 业务键 | 一份独立额度的标识 |
| hit / consumption | 命中 / 消耗 | 一次成功记录的发生 |
| rule | 规则 | 对业务键求值的一项约束 |
| sliding window | 滑动窗口 | 结束于当前时刻的固定时长区间 |
| calendar period | 自然周期 | 本地日、周、月或年分桶 |
| cooldown | 冷却期 | 相邻命中的最短时间间隔 |
| lifetime cap | 生命周期上限 | 一条持久记录的总命中上限 |
| cutoff | 截止时间 / 切日点 | 自然周期边界的墙上时钟偏移 |
| adapter | 适配器 | 存储契约的实现 |
| hydration | 水合 | 加载异步状态，或 React 接管 SSR 标记 |
| pruning | 裁剪 | 删除不再需要的时间戳历史 |
| fail-open | 故障放行 | 将不可读记录视为全新状态 |
| remaining | 剩余次数 | 最严格次数余量；`tryConsume` 后置计算 |
| next available at | 下次可用时间 | 所有时间阻塞解除的最早时刻 |