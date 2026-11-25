import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsync } from './useAsync'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe('useAsync', () => {
  it('moves from loading to success', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('done'), []))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'done' }))
  })

  it('reports errors and can retry', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useAsync(loader, []))

    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: 'ok' }))
  })

  it('never shows a stale result after the inputs change', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useAsync(() => (id === 'luke' ? slow.promise : fast.promise), [id]),
      { initialProps: { id: 'luke' } },
    )

    rerender({ id: 'leia' })
    await act(async () => fast.resolve('Leia'))
    await act(async () => slow.resolve('Luke'))

    expect(result.current).toMatchObject({ status: 'success', data: 'Leia' })
  })
})
