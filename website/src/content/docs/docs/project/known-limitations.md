---
title: Known limitations
description: Deliberate boundaries of v1.
---

- Atomic check-and-write applies only within one JavaScript context; tabs and processes can race, with last write winning.
- Calendar periods use the device's local timezone, not an IANA timezone selected by policy.
- React Native durability requires awaiting hydration and flushing pending writes before termination.
- The Node file adapter is not a multi-process database.
- Records are local storage state, not distributed server-side rate limits.
- Timestamp pruning cannot anticipate larger rules introduced later.
- Device clock changes affect all time rules.

Use a server-side transactional system when a cap must be authoritative across devices or users.