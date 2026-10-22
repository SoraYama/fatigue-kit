---
title: Record pruning
description: Bound timestamp history without losing lifetime counts.
---

After each successful consume, timestamps older than every active time-based rule needs are removed. The remaining list is then capped to the newest `maxHits` entries (default `100`); the lifetime counter is separate.

Choose `maxHits` at least as large as the greatest number of hits that any active sliding/calendar rule may need to count. Too small a value can undercount a high quota and allow early. Changing rule sets later cannot recover already pruned timestamps. Cooldown remains correct because the newest hit is retained.