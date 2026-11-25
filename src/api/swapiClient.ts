import type { SwapiFilm, SwapiPerson } from './types'

export const DEFAULT_BASE_URL = 'https://swapi.info/api'
const DEFAULT_TIMEOUT_MS = 10_000

/** Error raised for any failed request, with a message safe to show users. */
export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Result of loading several related resources where some may fail. */
export interface ManyResult<T> {
  items: T[]
  failedCount: number
}

export interface SwapiClient {
  getPeople(): Promise<SwapiPerson[]>
  getFilms(): Promise<SwapiFilm[]>
  getResource<T>(url: string): Promise<T>
  getMany<T>(urls: string[]): Promise<ManyResult<T>>
}

export interface SwapiClientOptions {
  baseUrl?: string
  timeoutMs?: number
  /** Injectable for tests; defaults to the browser's fetch. */
  fetchFn?: typeof fetch
}

/**
 * The single place the app talks to the Star Wars API.
 *
 * Responsibilities:
 * - Time out slow requests and convert every failure into an ApiError.
 * - Cache responses by URL. SWAPI data is static, and characters share
 *   films, planets and ships, so caching avoids repeat requests when users
 *   click between characters. In-flight requests are shared too.
 * - Load related resources in parallel, tolerating partial failure.
 */
export function createSwapiClient(options: SwapiClientOptions = {}): SwapiClient {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const fetchFn = options.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const cache = new Map<string, Promise<unknown>>()

  async function request(url: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchFn(url, { signal: controller.signal })
      if (!response.ok) {
        throw new ApiError(`The Star Wars API returned an error (${response.status}).`, response.status)
      }
      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (controller.signal.aborted) {
        throw new ApiError('The Star Wars API took too long to respond.')
      }
      throw new ApiError('Could not reach the Star Wars API. Check your connection and try again.')
    } finally {
      clearTimeout(timer)
    }
  }

  function getResource<T>(url: string): Promise<T> {
    const cached = cache.get(url)
    if (cached) return cached as Promise<T>

    const pending = request(url)
    cache.set(url, pending)
    // Do not cache failures, so a retry makes a fresh request.
    pending.catch(() => cache.delete(url))
    return pending as Promise<T>
  }

  async function getList<T>(collection: string): Promise<T[]> {
    const data = await getResource<unknown>(`${baseUrl}/${collection}`)
    // swapi.info returns a plain array. The original swapi.dev returns
    // { results: [...] }; accept both so a base URL switch does not break us.
    if (Array.isArray(data)) return data as T[]
    if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
      return (data as { results: T[] }).results
    }
    throw new ApiError('The Star Wars API returned data in an unexpected format.')
  }

  const getPeople = () => getList<SwapiPerson>('people')
  const getFilms = () => getList<SwapiFilm>('films')

  async function getMany<T>(urls: string[]): Promise<ManyResult<T>> {
    const settled = await Promise.allSettled(urls.map((url) => getResource<T>(url)))
    const items: T[] = []
    let failedCount = 0
    for (const result of settled) {
      if (result.status === 'fulfilled') items.push(result.value)
      else failedCount += 1
    }
    return { items, failedCount }
  }

  return { getPeople, getFilms, getResource, getMany }
}
