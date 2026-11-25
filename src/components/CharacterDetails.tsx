import type { SwapiClient } from '../api/swapiClient'
import type { SwapiPerson, SwapiPlanet, SwapiSpecies } from '../api/types'
import { formatNumber, formatText } from '../domain/format'
import { useAsync } from '../hooks/useAsync'
import { InfoTable } from './InfoTable'
import { StatusMessage } from './StatusMessage'

interface Props {
  person: SwapiPerson
  client: SwapiClient
}

export function CharacterDetails({ person, client }: Props) {
  return (
    <article className="details">
      <header className="details__header">
        <div className="avatar" aria-hidden="true" />
        <h2 className="character-name">{person.name}</h2>
      </header>

      <div className="details__columns">
        <section aria-labelledby="attributes-heading">
          <h3 id="attributes-heading" className="section-title">
            Attributes
          </h3>
          <InfoTable
            variant="grid"
            rows={[
              [
                'Birth year',
                formatText(person.birth_year),
                'BBY/ABY = Years Before(B) or Years After(A) the Battle of Yavin (BY). This is standard representation of the Star Wars calendar.',
              ],
              ['Gender', formatText(person.gender)],
              ['Height', formatNumber(person.height, 'cm')],
              ['Mass', formatNumber(person.mass, 'kg')],
              ['Eye color', formatText(person.eye_color)],
              ['Hair color', formatText(person.hair_color)],
              ['Skin color', formatText(person.skin_color)],
            ]}
          />
        </section>

        <section aria-labelledby="species-heading">
          <h3 id="species-heading" className="section-title">
            Species
          </h3>
          <SpeciesCard urls={person.species} client={client} />
        </section>

        <section aria-labelledby="homeworld-heading">
          <h3 id="homeworld-heading" className="section-title">
            Homeworld
          </h3>
          <HomeworldCard url={person.homeworld} client={client} />
        </section>
      </div>
    </article>
  )
}

function SpeciesCard({ urls, client }: { urls: string[]; client: SwapiClient }) {
  const species = useAsync(() => client.getMany<SwapiSpecies>(urls), [client, urls.join('|')])

  // SWAPI leaves species empty for most humans (e.g. Luke Skywalker), so an
  // empty list means the data is missing, not that there is no species.
  // Display rule: missing single values show "Unknown" (see README).
  if (urls.length === 0) return <UnknownCard />
  if (species.status === 'loading') return <StatusMessage kind="loading" message="Loading species…" />
  if (species.status === 'error' || species.data.items.length === 0) {
    return <StatusMessage kind="error" message="Species details could not be loaded." onRetry={species.retry} />
  }
  return (
    <>
      {species.data.items.map((s) => (
        <div className="card" key={s.url}>
          <h4 className="card__title">{formatText(s.name)}</h4>
          <InfoTable
            rows={[
              ['Classification', formatText(s.classification)],
              ['Designation', formatText(s.designation)],
              ['Average height', formatNumber(s.average_height, 'cm')],
              ['Average lifespan', formatNumber(s.average_lifespan, 'yr')],
              ['Language', formatText(s.language)],
            ]}
          />
        </div>
      ))}
    </>
  )
}

function UnknownCard() {
  return (
    <div className="card">
      <h4 className="card__title">Unknown</h4>
    </div>
  )
}

function HomeworldCard({ url, client }: { url: string; client: SwapiClient }) {
  const planet = useAsync(
    () => (url ? client.getResource<SwapiPlanet>(url) : Promise.resolve(null)),
    [client, url],
  )

  if (planet.status === 'loading') return <StatusMessage kind="loading" message="Loading homeworld…" />
  if (planet.status === 'error') {
    return <StatusMessage kind="error" message="Homeworld details could not be loaded." onRetry={planet.retry} />
  }
  // Every character has a homeworld; if none is given we just aren't told which.
  if (!planet.data) return <UnknownCard />
  const p = planet.data
  return (
    <div className="card">
      <h4 className="card__title">{formatText(p.name)}</h4>
      <InfoTable
        rows={[
          ['Population', formatNumber(p.population)],
          ['Terrain', formatText(p.terrain)],
          ['Climate', formatText(p.climate)],
          ['Surface water', formatNumber(p.surface_water, '%')],
          ['Diameter', formatNumber(p.diameter, 'km')],
          ['Rotation period', formatNumber(p.rotation_period, 'hr')],
          ['Orbital period', formatNumber(p.orbital_period, 'd')],
          ['Gravity', formatText(p.gravity)],
        ]}
      />
    </div>
  )
}
