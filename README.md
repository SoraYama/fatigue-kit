# fatigue-kit

English | [简体中文](./README.zh-CN.md)

> Zero-dependency frequency capping for Web, mini-programs, React Native and Node.js.

`fatigue-kit` answers one question: **should this popup / toast / guide / coupon be shown now?**
Compose simple rules, back them by any storage, and get an atomic, testable answer — synchronously — in every JS runtime.

## Features

- **Composable rules** — calendar day / week / month (custom cutoff), sliding window, cooldown, lifetime cap. Stack any number of rules; the strictest wins.
- **Atomic `tryConsume`** — check and count in one synchronous step, so double triggers can never double-fire.
- **Every environment, on demand** — zero-dependency core with storage adapters as subpath exports: `localStorage`, `sessionStorage`, React Native `AsyncStorage`, WeChat / Alipay mini-programs, Node.js file. Bundlers ship only what you import.
- **Testable** — inject the clock, inject the storage, inspect and seed records.
- **Small & safe** — ~3 kB gzip core, versioned self-pruning record format, corrupt storage degrades instead of throwing.

## Install

```sh
npm install fatigue-kit
```

## Quick start (Web)

```ts
import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'

const fatigue = createFatigue({ storage: localStorageAdapter() })

const result = fatigue.tryConsume('coupon-popup', [
  { max: 1, every: 'day' }, // once per calendar day
  { max: 3, window: '7d' }, // at most 3 times in any rolling 7 days
  { cooldown: '4h' }, // at least 4 hours between two showings
])

if (result.allowed) {
  showCouponPopup()
}
```

## Environments

| Environment | Adapter | Import |
| --- | --- | --- |
| Web / H5 (persistent) | `localStorageAdapter()` | `fatigue-kit/adapters/local-storage` |
| Web / H5 (per tab visit) | `sessionStorageAdapter()` | `fatigue-kit/adapters/session-storage` |
| React Native | `asyncStorageAdapter(AsyncStorage)` | `fatigue-kit/adapters/async-storage` |
| WeChat mini-program | `weappAdapter()` | `fatigue-kit/adapters/weapp` |
| Alipay mini-program | `alipayAdapter()` | `fatigue-kit/adapters/alipay` |
| Node.js (persistent) | `fileAdapter('./state.json')` | `fatigue-kit/adapters/node-file` |
| Tests / SSR / default | `memoryAdapter()` (built in) | — |

Anything with three synchronous functions is a valid adapter:

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
await handle.ready // hydrate the cache once

const fatigue = createFatigue({ storage: handle.storage })

AppState.addEventListener('change', (state) => {
  if (state === 'background') handle.flush() // don't lose the last writes
})
```

### Mini-programs

Enable **构建 npm** in the devtools, then `require('fatigue-kit/adapters/weapp')` — CommonJS subpaths are shipped for exactly this. No `DOM` assumptions anywhere in the core.

## API

### `createFatigue(options?)`

| Option | Default | Description |
| --- | --- | --- |
| `storage` | `memoryAdapter()` | Any `SyncStorage` |
| `clock` | system time | `{ now(): number }`, inject in tests |
| `namespace` | `'fatigue-kit'` | Prefix for storage keys |
| `maxHits` | `100` | Hits kept per record; older ones are pruned |

### Methods

- `tryConsume(key, rules)` — atomically check and consume. Returns `{ allowed, remaining, nextAvailableAt?, deniedBy? }`. `remaining` describes the state **after** the call: `remaining === 0` means "that was the last allowed consumption". `peek` reports the current state.
- `peek(key, rules)` — same result, without consuming.
- `reset(key?)` — forget one key, or all keys (needs `storage.keys()`).
- `exportRecord(key)` / `importRecord(key, record)` — inspect and seed records (migrations, debugging).

### Rules

| Rule | Meaning |
| --- | --- |
| `{ max: 1, every: 'day' }` | Once per calendar day (local time) |
| `{ max: 1, every: 'day', cutoff: '04:00' }` | Calendar day that starts at 04:00 |
| `{ max: 3, window: '7d' }` | At most 3 in any rolling 7 days |
| `{ cooldown: '4h' }` | At least 4 hours between two occurrences |
| `{ max: 5 }` | At most 5 times, ever |
| `every: 'week'` / `'month'` / `'year'`, `weekStartsOn` | Calendar periods |

Durations accept `'45s' / '30m' / '12h' / '7d'` or milliseconds. Calendar math uses local date components, so DST transitions never shift a boundary.

## Migrating legacy records

Coming from a legacy `{ times, date, duration, todayCount }` store?

```ts
import { migrateLegacyRecord } from 'fatigue-kit/legacy'

const migrated = migrateLegacyRecord(rawLegacyValue)
if (migrated) {
  fatigue.importRecord(key, migrated.record)
  // Keep the old "cooldown after last show" behaviour:
  const rules = [{ max: 1, window: '7d' }]
  if (migrated.cooldownMs !== null) rules.push({ cooldown: migrated.cooldownMs })
}
```

## Testing your rules

```ts
import { createFatigue } from 'fatigue-kit'
const clock = { current: 0, now: () => clock.current }
const fatigue = createFatigue({ storage: memoryAdapter(), clock })
fatigue.tryConsume('popup', [{ max: 1, every: 'day' }])
clock.current = Number.MAX_SAFE_INTEGER // travel to the end of time
expect(fatigue.peek('popup', [{ max: 1, every: 'day' }]).allowed).toBe(true)
```

## Known limitations (v1)

- Reads are atomic within one JS context; **cross-tab / cross-process** races are last-write-wins (a `BroadcastChannel`-based mode is on the roadmap).
- Calendar rules use device local time; IANA timezone support is planned.
- The RN adapter needs a `flush()` call on app-background to guarantee durability.

## Roadmap

- `@fatigue-kit/react` — `useFatigue()` hook bindings
- Group budgets — "all marketing popups together, max 3 per day", with priorities
- Cross-tab consistency, IANA timezone support, debug inspector

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Design decisions and the full migration plan (中文): [docs/design.zh-CN.md](./docs/design.zh-CN.md).

## License

[MIT](./LICENSE)
