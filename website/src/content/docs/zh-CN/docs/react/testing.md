---
title: 测试 React 绑定
description: 用确定性的核心状态测试显式操作。
---

每个测试创建独立的内存引擎和时钟，用 `FatigueProvider` 包裹组件，再触发用户操作。

```tsx
const clock = { now: () => 0 }
const fatigue = createFatigue({ storage: memoryAdapter(), clock })
render(<FatigueProvider value={fatigue}><Coupon /></FatigueProvider>)
await user.click(screen.getByRole('button'))
```

断言可见状态，也可检查 `fatigue.exportRecord(key)`。使用 `<StrictMode>` 捕获渲染副作用。SSR 测试先渲染字符串，再以等价初始记录水合并确认无 mismatch 警告。直接写核心不会通知 hook 订阅者；响应式测试应使用 hook action。