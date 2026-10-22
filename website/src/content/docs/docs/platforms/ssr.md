---
title: SSR
description: Isolate server requests and hydrate browser state deliberately.
---

The default memory adapter has no DOM dependency, so the core can run during SSR. Do not keep user-specific state in a process-global memory instance: create a request-scoped instance or provide request-scoped storage.

Web adapters resolve browser globals lazily, but server reads are empty and server writes cannot become browser persistence. For SSR, usually render from a deterministic/request record, then create the browser engine after hydration. Avoid making server and client markup depend on different fatigue records; perform consumption only in an event or effect, never during render.