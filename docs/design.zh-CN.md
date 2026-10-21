# fatigue-kit 设计决策与路线图

> 本文是项目的完整决策记录（ADR 汇总）与路线图。项目参考了一个私有遗留实现（约 130 行的 `fatigue.ts`，单规则、无测试）的**行为语义**后全新重写，用于修复其滑动窗口语义、读副作用、非原子写入与时区边界四类问题。

## 1. 定位

**一句话**：前端「频控 / 疲劳度」库 —— 回答"这个弹窗 / toast / 引导 / 优惠现在能不能出"。

- 英文语境对应 *frequency capping*，中文语境对应 *疲劳度控制*，检索量大、现成好用的库少，这是立足点。
- **不是**服务端限流库（无分布式计数、无并发竞态保护），不是 A/B 实验 SDK。
- 原样提取太单薄（1 个类 2 个方法、单一规则、无测试、依赖私有生态），因此采用**按新设计 cleanroom 重写**，而不是搬运旧代码。

## 2. 目标与非目标

**目标（v1）**

1. 零运行时依赖；核心 gzip ≤ 3.5 kB。
2. 全环境：Web/H5、微信/支付宝小程序、React Native、Node.js，统一 API。
3. 按需加载：adapter 走 subpath exports，只用多少装多少。
4. 原子 `tryConsume`，同 key 快速连点不会双弹。
5. 规则可组合：滑动窗口、自然日/周/月（可设日界线）、冷却、终身上限。
6. 时钟可注入，规则可测。
7. 提供旧数据（`{ times, date, duration, todayCount }`）迁移方案。

**非目标（v1，明确不做）**

- 跨 tab / 跨进程强一致（v1 为 last-write-wins，路线图里有 BroadcastChannel 方案）。
- IANA 时区（v1 用设备本地时间 + cutoff；时区在路线图）。
- 分组/全局预算（"所有营销弹窗合计每天 3 个"）→ v2。
- 服务端同步的策略下发。

## 3. 架构

```
┌──────────────────────────────────────────────┐
│ 应用层：H5 / 小程序 / RN / Node               │
├──────────────────────────────────────────────┤
│ createFatigue({ storage, clock, namespace }) │  ← 核心（同步、纯逻辑、零依赖）
│   规则编译 → 求值 → 消费/只读 → 记录修剪      │
├──────────────────────────────────────────────┤
│ SyncStorage 接口（get/set/remove/keys?）      │  ← 唯一约定
├──────┬───────┬────────┬───────┬───────┬──────┤
│memory│local/ │async-  │ weapp │alipay │node- │   ← 按需引入的 adapter
│(默认)│session│storage │ (wx)  │ (my)  │file  │
└──────┴───────┴────────┴───────┴───────┴──────┘
```

## 4. 关键决策（ADR）

### D1 · 核心 API 是同步的

- **决策**：`tryConsume/peek` 全部同步；异步存储由 adapter 的"预载 + 写回"解决（见 D8）。
- **理由**：旧代码 `get` 后再 `set`（且 set 未 await）导致连续触发可双弹，根因是异步把"检查"与"写入"拆成了两步。JS 单线程下同步 API 天然原子。
- **代价**：RN 场景需要先 `await adapter.ready`。可接受。

### D2 · 存储模型：命中时间戳数组 + 版本号

- **决策**：每个 key 存一条 `{ v: 1, hits: number[], lifetime: number }`，而不是旧版的聚合计数。
- **理由**：旧版一个 `date` 字段同时承担"窗口起点"和"最后命中日"两个职责，导致"X 天内"实际滑变成"冷却 X 天"。时间戳数组可以推导出任何规则，且写入时顺手修剪（`keepFrom` 之前 + `maxHits` 上限，默认 100 条），存储不会无限膨胀。
- **配套**：版本号不认识就当空记录重新开始（永不让坏数据抛错）；`lifetime` 计数器独立于修剪，保证终身规则永远准确。

### D3 · 规则模型：四种原语 + 取最严

| 规则 | 语义 | 备注 |
| --- | --- | --- |
| `{ max, window: '7d' }` | 滑动窗口内最多 N 次 | 毫秒精度，窗口左开右闭 |
| `{ max, every: 'day' }` | 每个自然日最多 N 次 | 可 `cutoff: '04:00'`、`weekStartsOn` |
| `{ cooldown: '4h' }` | 两次之间至少间隔 | 只限频率不限次数 |
| `{ max }` | 终身最多 N 次 | 依赖 `lifetime` 计数 |

多条规则叠加，`remaining` 取最小、`nextAvailableAt` 取最大、`deniedBy` 返回第一个拦截的规则。`remaining` 描述**本次调用之后**的状态：`tryConsume` 返回消费后的余量（`remaining === 0` 表示"刚才是最后一次"），`peek` 返回当前余量。刻意不做的语法糖：`per: 'day'`（自然日）与 `per: '7d'`（滑动）一词两义容易误用，拆成 `every` / `window` 两个独立字段。

### D4 · 日历规则：本地时间 + 日期分量运算，DST 安全

- **决策**：自然日/周/月边界全部用本地日期分量（`setDate`、`new Date(y, m, d)`）计算，禁止 `+ 24h` 毫秒算术；cutoff 以本地 `HH:mm` 偏移表示。
- **理由**：旧版 `date + (duration-1)*24h` 再按字符串比日期，既有夏令时问题又依赖 `new Date('YYYY/MM/DD')` 的非规范解析。毫秒级滑动窗口本来就是绝对时长，DST 无关；只有日历规则需要分量运算。
- **后续**：IANA 时区支持放在 v2（用 `Intl.DateTimeFormat` 做时区感知的分量运算）。

### D5 · 适配器：一个同步接口，七个内置实现

`SyncStorage = { get, set, remove, keys? }`，核心只认这一个接口。内置：

| Adapter | 环境 | 说明 |
| --- | --- | --- |
| `memoryAdapter` | 全部（默认） | 实例级内存；测试/SSR 用 |
| `localStorageAdapter` | Web/H5 | 持久；try/catch 降级不抛错（隐私模式/超配额） |
| `sessionStorageAdapter` | Web/H5 | 每 tab 生命周期，对应"本次访问只出一次" |
| `asyncStorageAdapter` | RN | 见 D8 |
| `weappAdapter` | 微信小程序 | 默认探测 `wx` 全局，可注入 client |
| `alipayAdapter` | 支付宝小程序 | 适配 `my` 的 `{ key, data }` 包裹格式 |
| `fileAdapter` | Node.js | 单 JSON 文件 + 临时文件改名写，原子落盘 |

所有 adapter 内部对存储异常统一 `onError`（默认 `console.warn`）不抛出：频控挂了不该打挂业务页面。

### D6 · 按需加载策略

- **单一 npm 包 + subpath exports**（而非 monorepo 多包）：`fatigue-kit` 只含核心 + memory；每个 adapter 是独立子路径 `fatigue-kit/adapters/*`。
- `sideEffects: false` + 每个 entry 独立构建 + ESM `splitting`（共享 chunk 不重复打包核心）；CJS 刻意不 splitting——小程序"构建 npm"沿 require 图打包，子路径天然按需。
- 另出 IIFE 全量压缩包（`fatigue-kit/global`，挂 `window.FatigueKit`）服务无构建的 `<script>` 场景；`unpkg`/`jsdelivr` 字段指向它。
- **放弃的备选**：每环境一个独立 npm 包（`@fatigue-kit/storage-weapp`）——版本对齐与发布成本高；等 React 绑定这类带 peer dep 的再加子包。

### D7 · 命名空间与 key 约定

存储 key = `${namespace}:${用户 key}`（默认前缀 `fatigue-kit`）。同一存储可并行多个实例互不干扰；`namespace` 必须与 adapter 选项一致（RN 索引键依赖它）。用户 key 需非空字符串；业务侧建议带版本语义（如 `coupon-popup-2026q4`）方便换策略。

### D8 · React Native：预载 + 写回（write-behind）

- ready 阶段按索引键 `__index__` 一次性拉取本库全部 key 进内存缓存；此后 `get` 走内存（同步、原子）。
- `set/remove` 先写缓存，去抖（默认 50ms）批量写回 AsyncStorage；索引键维护 key 清单。
- 暴露 `flush()`，配合 `AppState` 退后台时调用，避免杀进程丢最后一次写入。
- **限制**：卸载前未 flush 的写入会丢（频控场景可接受，README 已声明）。

### D9 · 容错策略

- 读：坏 JSON、未知版本、非字符串 → 空记录，不抛。
- 写：adapter 抛错 → onError 上报，调用方无感。
- 参数：规则/参数非法直接 `TypeError`（这是开发期错误，要大声失败）。

### D10 · 旧数据迁移（`fatigue-kit/legacy`）

- 旧格式 `{ times, date: 'YYYY/MM/DD', duration, todayCount }` → `migrateLegacyRecord()` 转成新记录：`hits = [该日 00:00]`、`lifetime = times`、`cooldownMs = duration * 86400000`。
- **近似声明**：旧数据只有"最后活动日 + 当日次数聚合"，无法还原精确时刻，迁移后该日按 1 次计（午夜时刻）。`todayCount` 无法精确恢复，文档明示；在意者可自行构造 `hits`。
- 用法：`importRecord(key, record)` 注入 + 按需补 `{ cooldown }` 规则；不做自动扫描迁移（调用方最清楚哪些 key 值得迁）。

### D11 · 工程化

| 项 | 选择 | 理由 |
| --- | --- | --- |
| 构建 | tsup（esm+cjs+iife，es2018 target） | 多 entry、dts、低配置；es2018 覆盖 Hermes 与主流小程序 |
| 测试 | vitest + 注入时钟 | CI 矩阵跑 `TZ=UTC/Asia/Shanghai/America/New_York` 验证日历逻辑 |
| Lint/Format | Biome | 单工具、快 |
| 体积 | size-limit（core ≤ 3.5 kB，adapter ≤ 4 kB） | 防膨胀 |
| 发版 | Changesets + GitHub Actions + npm provenance | 标准 OSS 流程 |

> ⚠️ Changesets 实践坑（2026-10 踩过）：① `@changesets/cli` v2.31.x 的根入口是 CLI 本体，不导出 changelog 函数，`"changelog": "@changesets/cli"`（含数组形式）必然报 "Could not resolve changelog generation functions"，要用 `@changesets/changelog-github`；② 开启 provenance 后首次发布必须 `publishConfig.access: "public"`，否则 npm 报 EUSAGE；③ 新仓库默认禁止 Actions 创建 PR，需在 Settings → Actions → Workflow permissions 打开，或用 API `PUT /repos/{owner}/{repo}/actions/permissions/workflow` 置 `can_approve_pull_request_reviews=true`。
>
> ⚠️ 2026-10 工具链升级（TS 6 / vitest 5 / tsup 9 / size-limit 14 / changesets 3）坑：① `changesets/action` v2 把 `publish` input **改名**为 `publish-script`，只改版本号会静默禁用发布（`create-github-releases`/`push-git-tags` 默认 true，与 v1 行为一致）；② **TypeScript 7 不可用**：它是 native-only API，tsup 9 的 rollup 管线直接 `require('typescript')` 且无 fallback（`@typescript/typescript6` fallback 只在 rollup-plugin-dts 里实现），node 22 下 dts 生成报 `parseJsonConfigFileContent is not a function`——停留 TS 6（最后一条完整 JS 编译器 API 版本线），tsup 官方支持 TS 7 后再升；③ CLI 3 / vitest 5 / tsup 9 均要求 node ≥ 22.12，CI 矩阵已去掉 node 20；④ CLI 3 × `@changesets/changelog-github` 1.0.1 兼容（v2.31 时代的坑不存在了，`changeset add → version` 全链路验证过）；⑤ 由 `GITHUB_TOKEN` 创建的 Version Packages PR，其 CI 首次为 `action_required` 状态，需 approve 该 workflow run 才会跑。
| 协议 | MIT，版权署名 `fatigue-kit contributors` | 见 D12 |

### D12 · 版权与合规（重要）

本项目为参考某私有遗留实现的公开行为语义后的**全新实现**：不复制任何原代码、不携带任何原仓库历史；`legacy.ts` 仅保留字段名（`times` / `date` / `duration` / `todayCount`）以兼容该格式的既有数据。仓库内不出现私有域名、私有 registry 或具体业务 key。

## 5. 环境适配矩阵

| 能力 | Web/H5 | 微信小程序 | 支付宝小程序 | RN | Node.js |
| --- | --- | --- | --- | --- | --- |
| 模块格式 | ESM+CJS+IIFE | CJS（构建 npm） | CJS | ESM（metro） | ESM+CJS |
| 持久化 adapter | local-storage | weapp | alipay | async-storage | node-file |
| 会话级 adapter | session-storage | memory | memory | memory | memory |
| 按需加载 | subpath + tree-shaking | require 子路径 | require 子路径 | subpath | subpath |
| 核心体积 | ≤3.5 kB gzip | 同左 | 同左 | 同左 | 同左 |

## 6. 测试计划（已落地）

- 规则单元：四类规则边界（窗口滚动、自然日翻转、cutoff 跨界、周/月/年边界含 1 月 31 日、冷却到期）。
- 组合语义：最严胜出、remaining/nextAvailableAt 聚合。
- 原子性：连续两次 tryConsume 第二次必拒（旧 bug 的回归测试）。
- 持久化/隔离：跨实例共享、namespace 隔离、坏数据、版本前向兼容、修剪与 lifetime 存活。
- adapter 契约：每个内置 adapter 过一遍引擎集成（写入前缀、keys、异常降级、RN 预载/flush/索引、支付宝 data 包裹、文件落盘）。
- legacy：格式转换 + "迁移后疲劳仍在" 集成。
- CI：node 20/22/24 × TZ 矩阵 + typecheck + lint + build + size。

## 7. 目录结构

```
fatigue-kit/
├── src/
│   ├── engine.ts        # 核心：编译规则→求值→消费
│   ├── calendar.ts      # 日历边界（DST 安全）
│   ├── duration.ts      # '7d'/'4h' → ms
│   ├── record.ts        # v1 记录编解码 + 修剪
│   ├── types.ts         # 全部公共类型
│   ├── legacy.ts        # 旧数据迁移
│   └── adapters/        # memory / web / local-storage / session-storage
│                        # / async-storage / weapp / alipay / node-file
├── test/                # vitest（引擎 + 日历 + 记录 + 迁移 + 全部 adapter）
├── docs/design.zh-CN.md # 本文
└── .github/workflows/   # ci.yml（矩阵）/ release.yml（changesets）
```

## 8. 项目状态与里程碑

1. ✅ **建仓**：MIT，工程骨架 + 核心实现 + 全量测试（含时区矩阵）。
2. ✅ **发布链路**：GitHub Actions（CI 矩阵 + changesets + provenance），`v0.2.0` 已发布到 npm。
3. ⬜ **`v1.0`**：API 冻结前过一轮 API review（路线图见 §9）。

## 9. 路线图

- **v0.x**：稳定核心 + adapter；收集真实业务规则诉求。
- **v1.0**：API 冻结；文档站（可用 README 起步）；badge/覆盖率。
- **v1.x**：`@fatigue-kit/react`；跨 tab 一致（BroadcastChannel/storage event）；IANA 时区。
- **v2**：分组/全局预算 + 优先级仲裁（营销弹窗互斥类需求的正解，差异化卖点）；调试面板（导出全部记录可视化）。

## 10. 已知限制

- 跨 tab / 跨进程为 last-write-wins；同 key 高频并发写以最后一次为准。
- 日历规则跟随设备本地时间；用户改时区会改变"今天"的边界（与业务直觉一致，但需知晓）。
- RN 未 flush 的写入可能丢失；小程序有总存储配额（wx 约 10MB），`maxHits` 修剪已控制单条体积。
