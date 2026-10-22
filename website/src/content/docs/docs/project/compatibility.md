---
title: Compatibility
description: Supported runtimes, modules and React versions.
---

| Surface | Support |
| --- | --- |
| Core | Modern JavaScript runtimes with ES2020-era APIs |
| Node file adapter | Node.js 18+ |
| Modules | ESM and CommonJS |
| Web | `localStorage` / `sessionStorage` when available |
| React Native | AsyncStorage-compatible client via cache adapter |
| Mini-programs | WeChat `wx` and Alipay `my` synchronous storage |
| React bindings | React 18 and 19 |
| TypeScript | Declarations included |

The core has no DOM dependency. Each adapter is a separate subpath export; import only the runtime adapter you need.