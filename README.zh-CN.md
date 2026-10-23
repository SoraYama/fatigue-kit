# fatigue-kit

[English](./README.md) | 简体中文

[使用文档](https://sorayama.github.io/fatigue-kit/zh-cn/docs/) · [在线演练](https://sorayama.github.io/fatigue-kit/zh-cn/playground/) · [React](https://sorayama.github.io/fatigue-kit/zh-cn/docs/api/react/) · [接入求助](https://github.com/SoraYama/fatigue-kit/issues/new/choose)

[![CI](https://github.com/SoraYama/fatigue-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/SoraYama/fatigue-kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fatigue-kit)](https://www.npmjs.com/package/fatigue-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> 零依赖的前端频控（疲劳度控制）库，覆盖 Web、小程序、React Native 和 Node.js。

`fatigue-kit` 只回答一个问题：**这个弹窗 / toast / 引导 / 优惠，现在能不能出？**
组合规则，接入自己的 UI 和存储，在单个 JavaScript 上下文中同步完成检查与计数。

## 特性

- **规则可组合** —— 自然日 / 周 / 月（可设日界线）、滑动窗口、冷却、终身上限。任意叠加，以最严为准。
- **同步 `tryConsume`** —— 在单个 JavaScript 上下文中一步完成检查与计数；跨 tab、跨进程协调需要单独的方案。
- **全环境、按需加载** —— 零依赖核心，存储适配器按子路径引入：`localStorage`、`sessionStorage`、React Native `AsyncStorage`、微信 / 支付宝小程序、Node.js 文件。bundler 只打包你 import 的部分。
- **可测试** —— 时钟可注入、存储可注入，记录可检查、可灌入。
- **小而稳** —— 核心零运行时依赖，记录带版本并自动修剪，损坏记录可恢复。1.0.1 的核心经 `npm run size` 实测为 2.06 kB（minified + Brotli）；同一压缩口径的 CI 预算为 3.5 kB。

## 安装

```sh
npm install fatigue-kit
```

## 快速开始（Web）

```ts
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'

const fatigue = createFatigue({ storage: localStorageAdapter() })

const result = fatigue.tryConsume('coupon-popup', [
  { max: 1, every: 'day' }, // 每个自然日最多 1 次
  { max: 3, window: '7d' }, // 任意滚动 7 天内最多 3 次
  { cooldown: '4h' }, // 两次之间至少间隔 4 小时
])

if (result.allowed) {
  showCouponPopup()
}
```

不传存储选项时默认使用内存，重新创建实例就会丢失记录。上面的 Web 示例使用 `localStorage` 保留刷新前的状态。记录范围由 namespace 和 key 决定，需要按用户或活动隔离时由调用方设计 key。`tryConsume` 允许时已经记账，请在接近实际展示的位置调用。

React 18/19 应用可以使用 [`fatigue-kit-react`](./packages/react/README.md)，通过显式动作和按 key 订阅管理状态。

## 环境支持

| 环境 | 适配器 | 引入路径 |
| --- | --- | --- |
| Web / H5（持久） | `localStorageAdapter()` | `fatigue-kit/adapters/local-storage` |
| Web / H5（每次访问） | `sessionStorageAdapter()` | `fatigue-kit/adapters/session-storage` |
| React Native | `asyncStorageAdapter(AsyncStorage)` | `fatigue-kit/adapters/async-storage` |
| 微信小程序 | `weappAdapter()` | `fatigue-kit/adapters/weapp` |
| 支付宝小程序 | `alipayAdapter()` | `fatigue-kit/adapters/alipay` |
| Node.js（持久） | `fileAdapter('./state.json')` | `fatigue-kit/adapters/node-file` |
| 测试 / SSR / 默认 | `memoryAdapter()`（内置） | — |

只要实现三个同步函数，就是合法的适配器：

```ts
import type { SyncStorage } from 'fatigue-kit'
const custom: SyncStorage = { get(key) { … }, set(key, value) { … }, remove(key) { … } }
```

### React Native

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { createFatigue } from 'fatigue-kit'
import { asyncStorageAdapter } from 'fatigue-kit/adapters/async-storage'

const handle = asyncStorageAdapter(AsyncStorage)
await handle.ready // 一次性预载缓存

const fatigue = createFatigue({ storage: handle.storage })

AppState.addEventListener('change', (state) => {
  if (state === 'background') handle.flush() // 别丢掉最后的写入
})
```

### 小程序

在开发者工具里开启 **构建 npm**，然后 `require('fatigue-kit/adapters/weapp')` —— CommonJS 子路径就是为这个场景发的。核心代码不做任何 `DOM` 假设。

## API

### `createFatigue(options?)`

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `storage` | `memoryAdapter()` | 任意 `SyncStorage` 实现。内置 adapter 出错时经 `onError` 上报而不抛出；自定义实现若可能抛错请自行 try/catch |
| `clock` | 系统时间 | `{ now(): number }`，测试时注入 |
| `namespace` | `'fatigue-kit'` | 存储 key 前缀 |
| `maxHits` | `100` | 每条记录保留的最大命中数，更旧的会被修剪 |

### 方法

- `tryConsume(key, rules)` —— 原子地检查并消费。返回 `{ allowed, remaining, nextAvailableAt?, deniedBy? }`。`remaining` 描述**本次调用之后**的状态：`remaining === 0` 表示"刚才是最后一次"；`peek` 返回当前状态。两个细节：无计数类规则时（如仅 cooldown）`remaining` 为 `Infinity`（JSON 序列化时注意）；`deniedBy` 是你**传入的同一规则对象**，可直接用 `===` 匹配。
- `peek(key, rules)` —— 结果相同，但不消费。
- `reset(key?)` —— 清除一个 key，或不传参数清除全部（需要 `storage.keys()`）。
- `exportRecord(key)` / `importRecord(key, record)` —— 读取与灌入记录（迁移、调试用）。

### 规则

| 规则 | 含义 |
| --- | --- |
| `{ max: 1, every: 'day' }` | 每个自然日（本地时间）最多 1 次 |
| `{ max: 1, every: 'day', cutoff: '04:00' }` | 从凌晨 4 点起算的"业务日" |
| `{ max: 3, window: '7d' }` | 任意滚动 7 天内最多 3 次 |
| `{ cooldown: '4h' }` | 两次之间至少间隔 4 小时 |
| `{ max: 5 }` | 终身最多 5 次 |
| `every: 'week'` / `'month'` / `'year'`、`weekStartsOn` | 日历周期 |

时长支持 `'45s' / '30m' / '12h' / '7d'` 或毫秒数。日历运算全部基于本地日期分量，夏令时切换不会移动边界。

## 迁移旧数据

从旧版 `{ times, date, duration, todayCount }` 存储迁移？

```ts
import { migrateLegacyRecord } from 'fatigue-kit/legacy'

const migrated = migrateLegacyRecord(rawLegacyValue)
if (migrated) {
  fatigue.importRecord(key, migrated.record)
  // 保持旧的"最后一次展示后冷却 N 天"行为：
  const rules = [{ max: 1, window: '7d' }]
  if (migrated.cooldownMs !== null) rules.push({ cooldown: migrated.cooldownMs })
}
```

## 测试你的规则

```ts
import { createFatigue, memoryAdapter } from 'fatigue-kit'
const clock = { current: 0, now: () => clock.current }
const fatigue = createFatigue({ storage: memoryAdapter(), clock })
fatigue.tryConsume('popup', [{ max: 1, every: 'day' }])
clock.current = Number.MAX_SAFE_INTEGER // 时间旅行到世界末日
expect(fatigue.peek('popup', [{ max: 1, every: 'day' }]).allowed).toBe(true)
```

## 已知限制（v1）

- 在存储操作成功时，检查与计数在单个 JS 上下文内原子；**跨 tab / 跨进程**是 last-write-wins（基于 `BroadcastChannel` 的方案在路线图上）。
- 日历规则跟随设备本地时间；IANA 时区支持在计划中。
- RN 需要等待预载完成，并在退后台时刷新待写入数据；进程终止或存储失败仍可能阻止持久化。
- 清理本地存储或更换设备会重置本地历史；终身上限适用于记录存续期间。存储故障会被上报，但频控可能降级；本地状态不是跨设备的权威配额。

## 路线图

路线图表达方向，而非承诺发布日期。

- **已提供 — v1.x：**发布包测试、双语文档、官网、Changelog、Roadmap、可分享 Playground 与 React 18/19 绑定，覆盖 Strict Mode、SSR 和 hydration。
- **Exploring：**跨 tab 状态协调（最终一致）、IANA 时区、explain/debug API 与异步原子消费。
- **Later — v2 候选：**共享预算、优先级仲裁、互斥与可视化调试工具。
- **Not planned：**服务端分布式限流、A/B 实验平台或远程策略管理。

## 参与贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。完整设计决策与迁移计划见 [docs/design.zh-CN.md](./docs/design.zh-CN.md)。

## 许可证

[MIT](./LICENSE)
