---
title: Error handling
description: Distinguish validation, adapter and data failures.
---

Invalid API input throws synchronously: empty keys/namespaces/rule arrays, invalid `max`, duration, calendar unit or cutoff, and unkeyed `reset()` without `keys()`.

Built-in adapters generally catch storage-operation failures and call `onError`; provide this callback for monitoring. Missing WeChat/Alipay globals throw when creating their adapters. Custom storage exceptions propagate unless your adapter catches them.

A denied rule is normal control flow, not an exception: inspect `allowed`, `deniedBy`, and `nextAvailableAt`.