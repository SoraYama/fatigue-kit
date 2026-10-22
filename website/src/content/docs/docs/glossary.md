---
title: Terminology glossary
description: English and Simplified Chinese terms used by fatigue-kit.
---

| English | 简体中文 | Meaning |
| --- | --- | --- |
| frequency capping | 频次控制 / 疲劳度控制 | Limiting how often an experience may occur |
| key | 键 / 业务键 | Identifier for one independent budget |
| hit / consumption | 命中 / 消耗 | One successful recorded occurrence |
| rule | 规则 | One constraint evaluated for a key |
| sliding window | 滑动窗口 | Fixed-duration interval ending at now |
| calendar period | 自然周期 | Local day, week, month, or year bucket |
| cooldown | 冷却期 | Minimum elapsed time between hits |
| lifetime cap | 生命周期上限 | Maximum total hits in a persisted record |
| cutoff | 截止时间 / 切日点 | Wall-clock offset of a calendar boundary |
| adapter | 适配器 | Implementation of the storage contract |
| hydration | 水合 | Loading async/persisted state or attaching React to SSR markup |
| pruning | 裁剪 | Removing timestamp history no longer needed |
| fail-open | 故障放行 | Treating unreadable records as fresh state |
| remaining | 剩余次数 | Strictest count allowance, after `tryConsume` |
| next available at | 下次可用时间 | Earliest epoch time after all time blockers clear |