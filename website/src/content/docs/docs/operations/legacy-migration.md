---
title: Legacy migration
description: Convert records from the former FatigueManager shape.
---

```ts
import { migrateLegacyRecord } from 'fatigue-kit/legacy'

const migrated = migrateLegacyRecord(raw)
if (migrated) {
  fatigue.importRecord(key, migrated.record)
  const rules = [{ max: 3, window: '7d' }]
  if (migrated.cooldownMs !== null) rules.push({ cooldown: migrated.cooldownMs })
}
```

The converter accepts JSON or `{ times, date, duration, todayCount }`. It maps `times` to lifetime, places one approximate hit at the date's local midnight, and returns `duration` days as an optional cooldown. `todayCount` cannot be reconstructed as individual timestamps. Invalid input or a missing usable date returns `null`; retain the legacy data until migration is verified.