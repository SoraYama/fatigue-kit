---
title: Sliding windows
description: Limit hits in a rolling duration.
---

```ts
{ max: 3, window: '7d' }
```

This permits at most three hits in the interval `(now - 7d, now]`; a hit exactly at the old boundary no longer counts. Durations accept positive millisecond numbers or strings using `s`, `m`, `h`, or `d`.

A denied result becomes available when its oldest counted hit plus the window is reached. A day in a duration is a fixed 24 hours; use a calendar rule for local calendar days.