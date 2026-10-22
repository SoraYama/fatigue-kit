---
title: 故障排查
description: 定位常见配置和行为问题。
---

- **状态重置：**检查命名空间/业务键稳定性、存储可用性、隐私模式和 `onError`。
- **RN 启动为空：**等待 `ready`，匹配命名空间，并在后台化时 `flush`。
- **`reset()` 报错：**实现 `keys()` 或调用 `reset(key)`。
- **周期边界异常：**检查设备时区、时钟、`cutoff`、`weekStartsOn`。
- **跨标签页/进程重复：**v1 无共享事务，最后写入获胜。
- **永不恢复：**生命周期上限没有未来重置时间，检查 `deniedBy`。
- **`Infinity` 变 `null`：**这是 JSON 行为，先转字符串或省略。
- **React UI 未更新：**通过 hook action 修改；直接调用核心不会自动通知订阅。