---
title: 支付宝小程序
description: 使用同步 my 存储。
---

完成小程序 npm 构建后：

```js
const { createFatigue } = require('fatigue-kit')
const { alipayAdapter } = require('fatigue-kit/adapters/alipay')
const fatigue = createFatigue({ storage: alipayAdapter() })
```

适配器处理支付宝对象参数和 `{ data }` 返回结构。支付宝外部环境需注入 `{ client }`，否则缺少 `my` 时创建会抛错。可通过 `onError` 采集存储异常。