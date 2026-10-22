---
title: Result semantics
description: Interpret allowed, remaining, nextAvailableAt and deniedBy.
---

Both `peek` and `tryConsume` return `ConsumeResult`.

- `allowed`: every rule currently permits consumption.
- `remaining`: strictest count-based allowance. For an allowed `tryConsume`, this is **after** consumption; `0` means the call used the final slot. `peek` reports the current state.
- `nextAvailableAt`: epoch milliseconds for the latest time-based blocker; absent while allowed and for an exhausted lifetime cap.
- `deniedBy`: first denying rule in input order, preserving object identity.

Cooldown-only results use `Infinity`, which JSON serializes as `null`; transform it before sending JSON if that distinction matters.