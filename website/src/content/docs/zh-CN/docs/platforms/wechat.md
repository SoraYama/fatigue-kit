---
title: 微信小程序
description: 使用同步 wx 存储。
---

在微信开发者工具开启**构建 npm**，然后导入 CommonJS 子路径：

```js
const { createFatigue } = require('fatigue-kit')
const { weappAdapter } = require('fatigue-kit/adapters/weapp')
const fatigue = createFatigue({ storage: weappAdapter() })
```

适配器使用同步 `wx` 存储。微信外部环境需注入 `{ client }`，否则创建时因缺少全局变量而抛错。存储操作失败通过 `onError` 上报，并退化为空或不持久状态。