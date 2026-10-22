---
title: Testing React bindings
description: Test explicit actions with deterministic core state.
---

Create a fresh memory-backed engine and clock per test, wrap the component in `FatigueProvider`, then trigger the user action.

```tsx
const clock = { now: () => 0 }
const fatigue = createFatigue({ storage: memoryAdapter(), clock })
render(<FatigueProvider value={fatigue}><Coupon /></FatigueProvider>)
await user.click(screen.getByRole('button'))
```

Assert visible state and optionally `fatigue.exportRecord(key)`. Wrap with `<StrictMode>` to catch render-time side effects. For SSR coverage, render to string then hydrate with equivalent initial records and assert there are no mismatch warnings. Direct core writes do not notify hook subscribers; use hook actions for reactive tests.