---
title: 兼容性
description: 支持的运行时、模块和 React 版本。
---

| 范围 | 支持情况 |
| --- | --- |
| 核心 | 具备 ES2020 常用 API 的现代 JavaScript 运行时 |
| Node 文件适配器 | Node.js 18+ |
| 模块 | ESM 与 CommonJS |
| Web | 可用时使用 `localStorage` / `sessionStorage` |
| React Native | 通过缓存适配器连接 AsyncStorage 兼容客户端 |
| 小程序 | 微信 `wx`、支付宝 `my` 同步存储 |
| React 绑定 | React 18 与 19 |
| TypeScript | 内置类型声明 |

核心不依赖 DOM。每个适配器都是独立子路径，只导入目标运行时所需适配器。