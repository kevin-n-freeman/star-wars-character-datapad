import type { SwapiClient } from '../api/swapiClient'
import type { SwapiPerson } from '../api/types'
import { CraftList } from './CraftList'
import { FilmStrip } from './FilmStrip'

interface Props {
  person: SwapiPerson
  client: SwapiClient
}

/** Films, starships and vehicles for the selected character. */
export function RelatedInfo({ person, client }: Props) {
  return (
    <div className="related">
      <section aria-labelledby="films-heading">
        <h2 id="films-heading" className="section-title">
          Films
        </h2>
        <div className="panel">
          <FilmStrip filmUrls={person.films} client={client} />
        </div>
      </section>

      <div className="related__crafts">
        <section aria-labelledby="starships-heading">
          <h2 id="starships-heading" className="section-title">
            Starships
          </h2>
          <div className="panel panel--flush">
            <CraftList urls={person.starships} client={client} label="starships" />
          </div>
        </section>
        <section aria-labelledby="vehicles-heading">
          <h2 id="vehicles-heading" className="section-title">
            Vehicles
          </h2>
          <div className="panel panel--flush">
            <CraftList urls={person.vehicles} client={client} label="vehicles" />
          </div>
        </section>
      </div>
    </div>
  )
}
