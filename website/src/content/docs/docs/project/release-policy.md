---
title: Release policy
description: Versioning, changesets and upgrade expectations.
---

fatigue-kit follows semantic versioning for published packages. Patch releases fix compatible behavior and documentation; minor releases add backward-compatible capabilities; major releases may change public APIs or persisted semantics.

Core and React bindings are versioned as separate packages and declare their compatibility through peer dependencies. Review each package changelog and published changesets before upgrading. Persisted records carry a format version; older code treats unknown future versions as empty rather than guessing.

Roadmap items describe direction, not committed dates or release guarantees.