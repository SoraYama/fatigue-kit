import { act, render, renderHook } from '@testing-library/react'
import { createFatigue, memoryAdapter, type FatigueRule } from 'fatigue-kit'
import { StrictMode, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FatigueProvider, useFatigue, useFatigueState } from '../src'

function provider(fatigue = createFatigue({ storage: memoryAdapter() })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <FatigueProvider value={fatigue}>{children}</FatigueProvider>
  }
}

describe('FatigueProvider and useFatigue', () => {
  it('returns the provided stable instance', () => {
    const fatigue = createFatigue()
    const { result, rerender } = renderHook(() => useFatigue(), { wrapper: provider(fatigue) })
    expect(result.current).toBe(fatigue)
    rerender()
    expect(result.current).toBe(fatigue)
  })

  it('fails clearly outside a provider', () => {
    expect(() => renderHook(() => useFatigue())).toThrow(/FatigueProvider/)
  })

  it('renders on the server without browser globals', () => {
    const fatigue = createFatigue()
    expect(
      renderToString(
        <FatigueProvider value={fatigue}>
          <span>safe</span>
        </FatigueProvider>,
      ),
    ).toContain('safe')
  })
})

describe('useFatigueState', () => {
  const rules = [{ max: 1 }] satisfies FatigueRule[]

  it('peeks without consuming during render', () => {
    const fatigue = createFatigue({ storage: memoryAdapter() })
    const { result } = renderHook(() => useFatigueState('popup', rules), {
      wrapper: provider(fatigue),
    })
    expect(result.current.result.allowed).toBe(true)
    expect(fatigue.exportRecord('popup')).toBeNull()
  })

  it('updates same-key subscribers after explicit consumption', () => {
    const fatigue = createFatigue({ storage: memoryAdapter() })
    const { result } = renderHook(
      () => [useFatigueState('popup', rules), useFatigueState('popup', rules)] as const,
      { wrapper: provider(fatigue) },
    )
    act(() => result.current[0].tryConsume())
    expect(result.current[0].result.allowed).toBe(false)
    expect(result.current[1].result.allowed).toBe(false)
  })

  it('resets a key and updates subscribers', () => {
    const { result } = renderHook(() => useFatigueState('popup', rules), { wrapper: provider() })
    act(() => result.current.tryConsume())
    expect(result.current.result.allowed).toBe(false)
    act(() => result.current.reset())
    expect(result.current.result.allowed).toBe(true)
  })

  it('does not consume during Strict Mode double renders', () => {
    const fatigue = createFatigue({ storage: memoryAdapter() })
    function Probe() {
      const state = useFatigueState('popup', rules)
      return <span>{state.result.allowed ? 'yes' : 'no'}</span>
    }
    render(
      <StrictMode>
        <FatigueProvider value={fatigue}>
          <Probe />
        </FatigueProvider>
      </StrictMode>,
    )
    expect(fatigue.exportRecord('popup')).toBeNull()
  })
})
