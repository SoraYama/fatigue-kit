---
title: Calendar cutoff
description: Move a calendar period boundary to a business time.
---

```ts
{ max: 1, every: 'day', cutoff: '04:00' }
```

`cutoff` is local wall-clock `HH:mm` (one- or two-digit hours are accepted). Before 04:00, the hit belongs to the calendar period that began at 04:00 on the previous natural boundary. The same offset applies to day, week, month, and year rules.

Hours must be 0–23 and minutes 0–59. Invalid values throw a `TypeError` when rules are evaluated.