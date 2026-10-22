---
title: 旧版迁移
description: 转换原 FatigueManager 数据结构。
---

```ts
const migrated = migrateLegacyRecord(raw)
if (migrated) {
  fatigue.importRecord(key, migrated.record)
  if (migrated.cooldownMs !== null) rules.push({ cooldown: migrated.cooldownMs })
}
```

转换器接受 JSON 或 `{ times, date, duration, todayCount }`。它把 `times` 映射为生命周期，在日期的本地午夜放置一个近似命中，并将 `duration` 天作为可选冷却期返回。`todayCount` 无法还原成逐条时间戳。无效输入或缺少可用日期时返回 `null`；验证迁移前应保留旧数据。