---
title: Alipay mini-program
description: Use synchronous my storage.
---

After the mini-program npm build step:

```js
const { createFatigue } = require('fatigue-kit')
const { alipayAdapter } = require('fatigue-kit/adapters/alipay')
const fatigue = createFatigue({ storage: alipayAdapter() })
```

The adapter understands Alipay's object arguments and `{ data }` response. Outside Alipay, inject `{ client }`; otherwise a missing `my` global throws during adapter creation. Use `onError` for storage telemetry.