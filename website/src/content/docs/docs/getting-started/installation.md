---
title: Installation
description: Install the core package and optional React bindings.
---

Requires Node.js 18+ for Node tooling and the file adapter.

```sh
npm install fatigue-kit
# React 18 or 19 only:
npm install fatigue-kit-react
```

Import the zero-dependency core from `fatigue-kit`. Import adapters from explicit subpaths so bundlers include only the selected runtime integration.

```ts
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'
```

ES modules and CommonJS are published. Mini-program tooling can use `require()` after its npm build step.