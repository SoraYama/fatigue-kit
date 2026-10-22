---
title: Troubleshooting
description: Diagnose common setup and behavior problems.
---

- **State resets:** check namespace/key stability, storage availability, private mode, and `onError` logs.
- **RN starts empty:** await `handle.ready`; use matching namespaces; flush on background.
- **`reset()` throws:** provide `keys()` or call `reset(key)`.
- **Unexpected calendar boundary:** inspect device timezone, clock, `cutoff`, and `weekStartsOn`.
- **Duplicate cross-tab/process display:** v1 has no shared transaction; last write wins.
- **Rule never becomes available:** lifetime caps have no future reset; inspect `deniedBy`.
- **`Infinity` becomes `null`:** JSON does this; map it to a string or omit it.
- **React UI is stale:** mutate through hook actions, or remount/notify after direct core writes.