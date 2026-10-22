---
title: React Strict Mode
description: Keep frequency consumption explicit and replay-safe.
---

`useFatigueState` only calls `peek` while rendering. It never consumes on render or mount, so Strict Mode's development re-renders do not spend a budget.

```tsx
const state = useFatigueState('coupon', rules)
return <button disabled={!state.result.allowed} onClick={state.tryConsume}>Show</button>
```

Consume in an explicit user/event action. Avoid `tryConsume` in render, state initializers, or mount effects that may be replayed. Keep the provider's `value` stable; changing the engine creates a new subscription store.