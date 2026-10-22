---
title: Core concepts
description: Keys, rules, records, storage and atomic consumption.
---

- A **key** identifies one budget, such as `coupon-popup`.
- **Rules** describe when that key may be consumed. All supplied rules must allow it.
- A **record** stores ascending hit timestamps plus a lifetime counter under `<namespace>:<key>`.
- A synchronous **storage adapter** makes the same engine usable in different runtimes.
- `peek` evaluates without writing. `tryConsume` evaluates and, only when allowed, records one hit in the same synchronous call.

Create long-lived instances rather than recreating memory-backed instances per operation. Choose stable keys and a namespace that does not collide with other applications.