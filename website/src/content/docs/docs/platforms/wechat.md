---
title: WeChat mini-program
description: Use synchronous wx storage.
---

Enable **构建 npm** in WeChat DevTools, then import the CommonJS subpath:

```js
const { createFatigue } = require('fatigue-kit')
const { weappAdapter } = require('fatigue-kit/adapters/weapp')
const fatigue = createFatigue({ storage: weappAdapter() })
```

The adapter uses synchronous `wx` storage. Outside WeChat, inject `{ client }`; otherwise a missing global throws during adapter creation. Storage-operation failures are reported through `onError` and degrade to empty/non-durable state.