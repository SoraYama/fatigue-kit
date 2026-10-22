---
title: Week starts on
description: Configure the first weekday for weekly calendar rules.
---

```ts
{ max: 2, every: 'week', weekStartsOn: 0 } // Sunday
```

`weekStartsOn` follows JavaScript weekday numbers: `0` Sunday through `6` Saturday. The default is `1` (Monday). It matters only for `every: 'week'`.

If a cutoff is also present, the weekly boundary is that weekday at the cutoff time in device-local time.