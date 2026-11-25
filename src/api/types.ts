/**
 * Raw resource shapes as returned by https://swapi.info/api.
 *
 * SWAPI returns every value as a string (including numbers) and uses the
 * strings "unknown" and "n/a" for missing data. Related resources are
 * referenced by URL, never embedded. These types mirror the wire format
 * exactly; conversion to display-friendly values happens in src/domain.
 */

export type ResourceUrl = string

export interface SwapiPerson {
  name: string
  height: string
  mass: string
  hair_color: string
  skin_color: string
  eye_color: string
  birth_year: string
  gender: string
  homeworld: ResourceUrl
  films: ResourceUrl[]
  species: ResourceUrl[]
  vehicles: ResourceUrl[]
  starships: ResourceUrl[]
  url: ResourceUrl
}

export interface SwapiFilm {
  title: string
  episode_id: number
  release_date: string
  url: ResourceUrl
}

export interface SwapiSpecies {
  name: string
  classification: string
  designation: string
  average_height: string
  average_lifespan: string
  language: string
  url: ResourceUrl
}

export interface SwapiPlanet {
  name: string
  population: string
  terrain: string
  climate: string
  surface_water: string
  diameter: string
  rotation_period: string
  orbital_period: string
  gravity: string
  url: ResourceUrl
}

/** Starships and vehicles share the fields the UI needs. */
export interface SwapiCraft {
  name: string
  model: string
  manufacturer: string
  crew: string
  passengers: string
  url: ResourceUrl
  /** Present on starships. */
  starship_class?: string
  /** Present on vehicles. */
  vehicle_class?: string
}
