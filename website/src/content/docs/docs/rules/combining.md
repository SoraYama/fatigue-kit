---
title: Combining rules
description: Compose constraints with AND semantics.
---

```ts
const rules = [
  { max: 1, every: 'day' },
  { max: 3, window: '7d' },
  { cooldown: '4h' },
]
```

Every rule must allow the hit. `tryConsume` writes one shared hit only after the complete set allows it; denial does not consume. `remaining` is the minimum allowance among count-based rules, and `nextAvailableAt` is the latest blocking time.

`deniedBy` is the first denying rule in input order and is the same object reference supplied by the caller.