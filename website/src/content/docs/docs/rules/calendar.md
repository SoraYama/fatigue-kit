---
title: Calendar limits
description: Limit hits by local day, week, month or year.
---

```ts
{ max: 2, every: 'month' }
```

Calendar rules group hits by device-local wall-clock `day`, `week`, `month`, or `year`. Boundaries are built from local date components, so daylight-saving transitions do not turn a boundary into “midnight plus 24 hours”.

The default boundary is local midnight. Weeks start Monday by default. Use `cutoff` and `weekStartsOn` to change those definitions. Device clock or timezone changes can therefore change the active period.