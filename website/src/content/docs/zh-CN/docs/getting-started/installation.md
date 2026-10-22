---
title: 安装
description: 安装核心包与可选 React 绑定。
---

Node 工具和文件适配器要求 Node.js 18+。

```sh
npm install fatigue-kit
# 仅 React 18 或 19：
npm install fatigue-kit-react
```

核心从 `fatigue-kit` 导入；适配器使用独立子路径，打包器只需包含目标运行时集成。

```ts
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'
```

包同时提供 ESM 与 CommonJS。小程序完成 npm 构建后可使用 `require()`。