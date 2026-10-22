import type { ConsumeResult, Fatigue, FatigueRule } from 'fatigue-kit'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'

type Listener = () => void

interface FatigueStore {
  fatigue: Fatigue
  subscribe(key: string, listener: Listener): () => void
  version(key: string): number
  notify(key?: string): void
}

function createStore(fatigue: Fatigue): FatigueStore {
  const listeners = new Map<string, Set<Listener>>()
  const versions = new Map<string, number>()
  let allVersion = 0
  return {
    fatigue,
    subscribe(key, listener) {
      const set = listeners.get(key) ?? new Set<Listener>()
      set.add(listener)
      listeners.set(key, set)
      return () => {
        set.delete(listener)
        if (set.size === 0) listeners.delete(key)
      }
    },
    version(key) {
      return (versions.get(key) ?? 0) + allVersion
    },
    notify(key) {
      if (key === undefined) {
        allVersion += 1
        for (const set of listeners.values()) for (const listener of set) listener()
        return
      }
      versions.set(key, (versions.get(key) ?? 0) + 1)
      for (const listener of listeners.get(key) ?? []) listener()
    },
  }
}

const FatigueContext = createContext<FatigueStore | null>(null)

export interface FatigueProviderProps {
  value: Fatigue
  children?: ReactNode
}

export function FatigueProvider({ value, children }: FatigueProviderProps) {
  const store = useMemo(() => createStore(value), [value])
  return <FatigueContext.Provider value={store}>{children}</FatigueContext.Provider>
}

function useStore(): FatigueStore {
  const store = useContext(FatigueContext)
  if (store === null) {
    throw new Error('[fatigue-kit/react] Hooks must be used inside <FatigueProvider>.')
  }
  return store
}

export function useFatigue(): Fatigue {
  return useStore().fatigue
}

export interface FatigueState {
  result: ConsumeResult
  peek(): ConsumeResult
  tryConsume(): ConsumeResult
  reset(): void
}

export function useFatigueState(
  key: string,
  rules: FatigueRule | readonly FatigueRule[],
): FatigueState {
  const store = useStore()
  const normalizedRules = rules as FatigueRule | FatigueRule[]
  const subscribe = useCallback((listener: Listener) => store.subscribe(key, listener), [store, key])
  const getSnapshot = useCallback(() => store.version(key), [store, key])
  const version = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const result = useMemo(
    () => store.fatigue.peek(key, normalizedRules),
    [store, key, normalizedRules, version],
  )
  const peek = useCallback(() => store.fatigue.peek(key, normalizedRules), [store, key, normalizedRules])
  const tryConsume = useCallback(() => {
    const next = store.fatigue.tryConsume(key, normalizedRules)
    store.notify(key)
    return next
  }, [store, key, normalizedRules])
  const reset = useCallback(() => {
    store.fatigue.reset(key)
    store.notify(key)
  }, [store, key])
  return useMemo(() => ({ result, peek, tryConsume, reset }), [result, peek, tryConsume, reset])
}
