---
title: Lifetime caps
description: Limit total successful consumption forever.
---

```ts
{ max: 5 }
```

A lifetime rule permits at most `max` successful consumptions for a key. The separate `lifetime` counter survives timestamp pruning, so old hits do not restore the budget.

`reset(key)` intentionally starts that key over. Changing namespaces or losing storage also creates a fresh budget. Lifetime here means the lifetime of the persisted record, not a globally coordinated user lifetime.