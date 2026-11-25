import type { SwapiClient } from '../api/swapiClient'
import type { SwapiCraft } from '../api/types'
import { formatPair, formatText } from '../domain/format'
import { useAsync } from '../hooks/useAsync'
import { StatusMessage } from './StatusMessage'

interface Props {
  urls: string[]
  client: SwapiClient
  /** Plural label used in messages, e.g. "starships". */
  label: string
}

/** Starships and vehicles share one component: same fields, same layout. */
export function CraftList({ urls, client, label }: Props) {
  const crafts = useAsync(() => client.getMany<SwapiCraft>(urls), [client, urls.join('|')])

  if (urls.length === 0) {
    // An empty list can mean "pilots nothing" or "not recorded"; the API does
    // not say which, so we use the neutral "None listed" (see README).
    return <StatusMessage kind="empty" message="None listed" />
  }
  if (crafts.status === 'loading') return <StatusMessage kind="loading" message={`Loading ${label}…`} />
  if (crafts.status === 'error' || crafts.data.items.length === 0) {
    return <StatusMessage kind="error" message={`The ${label} could not be loaded.`} onRetry={crafts.retry} />
  }

  const { items, failedCount } = crafts.data
  return (
    <>
      <ul className="craft-list">
        {items.map((craft) => (
          <li key={craft.url} className="craft">
            <div className="placeholder placeholder--box" aria-hidden="true" />
            <dl className="craft__info">
              <div className="craft__row">
                <dt className="craft__name">{craft.name}</dt>
                <dd>{formatText(craft.starship_class ?? craft.vehicle_class)}</dd>
              </div>
              <div className="craft__row">
                <dt>Crew / Passengers:</dt>
                <dd>{formatPair(craft.crew, craft.passengers)}</dd>
              </div>
              <div className="craft__row">
                <dt>Model / Manufacturer:</dt>
                <dd>
                  {formatText(craft.model)} / {formatText(craft.manufacturer)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      {failedCount > 0 && (
        <StatusMessage
          kind="error"
          message={`${failedCount} of ${urls.length} ${label} could not be loaded.`}
          onRetry={crafts.retry}
        />
      )}
    </>
  )
}
