import type { ManyResult, SwapiClient } from '../api/swapiClient'
import type { SwapiFilm, SwapiPerson } from '../api/types'

/**
 * In-memory stand-in for the real API client. Tests describe the data they
 * need as a map of URL -> resource, so no test ever touches the network.
 */
export function createFakeClient(options: {
  people?: SwapiPerson[] | Error
  films?: SwapiFilm[] | Error
  resources?: Record<string, unknown>
}): SwapiClient {
  const resources = options.resources ?? {}

  async function getResource<T>(url: string): Promise<T> {
    if (!(url in resources)) throw new Error(`Not found: ${url}`)
    const value = resources[url]
    if (value instanceof Error) throw value
    return value as T
  }

  return {
    async getPeople() {
      const people = options.people ?? []
      if (people instanceof Error) throw people
      return people
    },
    async getFilms() {
      const films = options.films ?? []
      if (films instanceof Error) throw films
      return films
    },
    getResource,
    async getMany<T>(urls: string[]): Promise<ManyResult<T>> {
      const settled = await Promise.allSettled(urls.map((url) => getResource<T>(url)))
      return {
        items: settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
        failedCount: settled.filter((r) => r.status === 'rejected').length,
      }
    },
  }
}

export function makePerson(overrides: Partial<SwapiPerson> & { name: string }): SwapiPerson {
  const id = overrides.name.toLowerCase().replace(/\W+/g, '-')
  return {
    height: '172',
    mass: '77',
    hair_color: 'blond',
    skin_color: 'fair',
    eye_color: 'blue',
    birth_year: '19BBY',
    gender: 'male',
    homeworld: '',
    films: [],
    species: [],
    vehicles: [],
    starships: [],
    url: `https://swapi.test/api/people/${id}`,
    ...overrides,
  }
}
