---
title: React Strict Mode
description: 保持消耗显式且可安全重放。
---

`useFatigueState` 在渲染时只调用 `peek`，不会在 render 或 mount 时消耗，因此 Strict Mode 开发环境重复渲染不会花掉额度。

```tsx
const state = useFatigueState('coupon', rules)
return <button disabled={!state.result.allowed} onClick={state.tryConsume}>展示</button>
```

只在显式用户或事件操作中消耗。不要在 render、状态初始化器或可能重放的挂载 effect 中调用 `tryConsume`。保持 Provider 的 `value` 稳定；更换引擎会创建新的订阅 store。