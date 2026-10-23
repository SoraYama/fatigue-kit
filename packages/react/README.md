# fatigue-kit-react

React 18/19 bindings for [fatigue-kit](https://www.npmjs.com/package/fatigue-kit): local frequency capping for your own popups, toasts and onboarding.

[Documentation](https://sorayama.github.io/fatigue-kit/docs/api/react/) · [简体中文文档](https://sorayama.github.io/fatigue-kit/zh-cn/docs/api/react/) · [Playground](https://sorayama.github.io/fatigue-kit/playground/) · [Help and feedback](https://github.com/SoraYama/fatigue-kit/issues/new/choose)

## Install

```sh
npm install fatigue-kit fatigue-kit-react
```

Both `fatigue-kit` and React are peer dependencies. The core has no runtime dependencies; this binding uses your application's React installation.

## Browser example

Create the engine once in your browser entry point. This example uses `localStorage` so its record survives reloads.

```tsx
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'
import { FatigueProvider, useFatigueState } from 'fatigue-kit-react'

const fatigue = createFatigue({ storage: localStorageAdapter() })

function Coupon() {
  const [open, setOpen] = useState(false)
  const popup = useFatigueState('coupon', [
    { max: 1, every: 'day' },
    { max: 3, window: '7d' },
    { cooldown: '4h' },
  ])

  function showCoupon() {
    if (popup.tryConsume().allowed) setOpen(true)
  }

  return (
    <>
      <button onClick={showCoupon}>Show coupon</button>
      <p>{popup.result.allowed ? 'Available' : 'Frequency cap reached'}</p>
      {open && (
        <section aria-label="Coupon">
          <p>Your coupon content</p>
          <button onClick={() => setOpen(false)}>Close</button>
        </section>
      )}
    </>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <FatigueProvider value={fatigue}><Coupon /></FatigueProvider>,
  )
}
```

The binding does not render a popup or manage its focus: use your existing accessible dialog component. The section above only illustrates conditional rendering.

## API

- `FatigueProvider value={fatigue}` supplies an existing engine.
- `useFatigueState(key, rules)` returns `{ result, peek, tryConsume, reset }`. Render reads state; explicit actions consume it.
- `useFatigue()` returns the core engine without a subscription. Direct mutations through it do not notify hook subscribers.

`tryConsume` counts an allowed attempt before your UI appears. Call it in the display action, never during render or mount. The hooks only peek during render and support Strict Mode.

## Storage and SSR

- `createFatigue()` defaults to memory; recreating it discards its history. Choose an adapter for persistence.
- The browser entry above uses `document` and `localStorage`; do not evaluate it on a server. For SSR, create request-scoped state and follow the [SSR/hydration guide](https://sorayama.github.io/fatigue-kit/docs/react/ssr-hydration/). Never share user state in a process-global engine.
- Namespace and key define record identity; separate users or campaigns explicitly.
- Atomic check-and-count applies within one JavaScript context when storage succeeds. Cross-tab/device quotas and popup arbitration require another system. Storage failures and cleared records can weaken caps.

## License

[MIT](https://github.com/SoraYama/fatigue-kit/blob/main/LICENSE)
