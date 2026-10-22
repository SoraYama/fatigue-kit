---
title: SSR and hydration
description: Produce stable server and client snapshots.
---

The bindings use `useSyncExternalStore` with the same version snapshot for server and client. This makes subscription mechanics hydration-safe, but your engine state must also be consistent.

Create request-scoped server engines and do not consume during render. If the browser uses persisted storage unavailable to the server, avoid rendering state-dependent differences before hydration, or seed both sides with the same exported record. Create the browser engine once and pass a stable value to `FatigueProvider`.