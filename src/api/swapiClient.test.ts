import { ApiError, createSwapiClient } from './swapiClient'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createSwapiClient', () => {
  it('loads people when the API returns a plain array', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([{ name: 'Luke Skywalker' }]))
    const client = createSwapiClient({ fetchFn, baseUrl: 'https://example.test/api' })

    const people = await client.getPeople()

    expect(people).toEqual([{ name: 'Luke Skywalker' }])
    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/people', expect.any(Object))
  })

  it('also accepts the paginated { results } shape used by swapi.dev', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ results: [{ name: 'Leia Organa' }] }))
    const client = createSwapiClient({ fetchFn })

    await expect(client.getPeople()).resolves.toEqual([{ name: 'Leia Organa' }])
  })

  it('rejects an unexpected response shape with a clear error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ unexpected: true }))
    const client = createSwapiClient({ fetchFn })

    await expect(client.getPeople()).rejects.toThrow(/unexpected format/i)
  })

  it('caches responses so the same URL is only requested once', async () => {
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ name: 'Tatooine' })))
    const client = createSwapiClient({ fetchFn })

    await client.getResource('https://example.test/api/planets/1')
    await client.getResource('https://example.test/api/planets/1')

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('turns HTTP errors into an ApiError with the status code', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 404))
    const client = createSwapiClient({ fetchFn })

    const error = await client.getResource('https://example.test/api/planets/999').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })

  it('turns network failures into a friendly ApiError', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const client = createSwapiClient({ fetchFn })

    await expect(client.getPeople()).rejects.toThrow(/could not reach/i)
  })

  it('does not cache failures, so a retry makes a fresh request', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse([{ name: 'Yoda' }]))
    const client = createSwapiClient({ fetchFn })

    await expect(client.getPeople()).rejects.toBeInstanceOf(ApiError)
    await expect(client.getPeople()).resolves.toEqual([{ name: 'Yoda' }])
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('times out slow requests', async () => {
    vi.useFakeTimers()
    const fetchFn = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const client = createSwapiClient({ fetchFn, timeoutMs: 1000 })

    const pending = client.getPeople()
    const assertion = expect(pending).rejects.toThrow(/too long/i)
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    vi.useRealTimers()
  })

  it('loads several related resources and reports how many failed', async () => {
    const fetchFn = vi.fn().mockImplementation((url: string) =>
      url.endsWith('/2')
        ? Promise.resolve(jsonResponse({}, 500))
        : Promise.resolve(jsonResponse({ url })),
    )
    const client = createSwapiClient({ fetchFn })

    const result = await client.getMany<{ url: string }>([
      'https://example.test/api/films/1',
      'https://example.test/api/films/2',
      'https://example.test/api/films/3',
    ])

    expect(result.items.map((item) => item.url)).toEqual([
      'https://example.test/api/films/1',
      'https://example.test/api/films/3',
    ])
    expect(result.failedCount).toBe(1)
  })
})
