---
title: Cooldown
description: Require elapsed time between consecutive hits.
---

```ts
{ cooldown: '4h' }
```

A cooldown allows the first hit, then requires at least the duration since the latest recorded hit. When denied, `nextAvailableAt` is `lastHit + cooldown`.

Cooldown is not a count limit, so a cooldown-only result has `remaining: Infinity`. Combine it with a count rule when both spacing and a quota are required.