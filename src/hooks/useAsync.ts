import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

type Settled<T> = { status: 'success'; data: T } | { status: 'error'; error: Error }

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
}

/**
 * Runs an async loader and tracks loading / success / error state.
 *
 * - Re-runs whenever `deps` change (or `retry` is called).
 * - Each result is stored with the deps that produced it; if the deps have
 *   since changed, the state reads as "loading". This means a slow response
 *   for a previously selected character can never be shown for the current one.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: readonly unknown[]; settled: Settled<T> } | null>(null)
  const key = [...deps, attempt]

  useEffect(() => {
    let cancelled = false
    const runKey = key
    loader().then(
      (data) => {
        if (!cancelled) setResult({ key: runKey, settled: { status: 'success', data } })
      },
      (error: unknown) => {
        if (!cancelled) {
          const err = error instanceof Error ? error : new Error(String(error))
          setResult({ key: runKey, settled: { status: 'error', error: err } })
        }
      },
    )
    return () => {
      cancelled = true
    }
    // The caller controls when to reload through `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, key)

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const state: AsyncState<T> =
    result && sameDeps(result.key, key) ? result.settled : { status: 'loading' }
  return { ...state, retry }
}
