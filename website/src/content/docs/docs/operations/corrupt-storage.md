---
title: Corrupt storage
description: Understand fail-open record decoding and recovery.
---

Malformed JSON, non-object values, and unknown record versions decode as an empty record. Partially valid version-1 records keep finite numeric hits, sort them, and derive lifetime from hit count when lifetime is invalid.

This fail-open behavior protects host applications but may show content again. Monitor adapter errors and protect storage from untrusted mutation when repetition is costly. Use `exportRecord` to inspect and `reset(key)` or validated `importRecord` to repair a key. An unknown future version is intentionally not interpreted by older code.