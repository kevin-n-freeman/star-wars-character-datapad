import type { SwapiPerson } from '../api/types'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim()
}

/**
 * Filters characters by name.
 *
 * swapi.info has no search endpoint, and the full list is only ~80 records,
 * so filtering the already-loaded list in the browser is instant and avoids
 * extra network calls. Matching is case- and accent-insensitive and matches
 * anywhere in the name ("sky" finds "Luke Skywalker").
 */
export function filterCharacters(people: SwapiPerson[], query: string): SwapiPerson[] {
  const needle = normalize(query)
  if (!needle) return people
  return people.filter((person) => normalize(person.name).includes(needle))
}
