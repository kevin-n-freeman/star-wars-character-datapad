import type { SwapiClient } from '../api/swapiClient'
import type { SwapiFilm } from '../api/types'
import { toRoman } from '../domain/roman'
import { useAsync } from '../hooks/useAsync'
import { StatusMessage } from './StatusMessage'

interface Props {
  filmUrls: string[]
  client: SwapiClient
}

/**
 * Shows every film in episode order and highlights the ones the character
 * appears in, as in the wireframe. The film list is one cached request
 * shared by all characters.
 */
export function FilmStrip({ filmUrls, client }: Props) {
  const films = useAsync(() => client.getFilms(), [client])

  if (films.status === 'loading') return <StatusMessage kind="loading" message="Loading films…" />
  if (films.status === 'error') {
    return <StatusMessage kind="error" message="Films could not be loaded." onRetry={films.retry} />
  }

  const appearsIn = new Set(filmUrls)
  const ordered = [...films.data].sort((a: SwapiFilm, b: SwapiFilm) => a.episode_id - b.episode_id)
  if (appearsIn.size === 0) {
    return <StatusMessage kind="empty" message="This character does not appear in any films." />
  }

  return (
    <ul className="film-strip">
      {ordered.map((film) => {
        const appears = appearsIn.has(film.url)
        return (
          <li key={film.url} className={`film${appears ? '' : ' film--absent'}`}>
            <div className="placeholder placeholder--image" aria-hidden="true" />
            <span className="film__title">{film.title}</span>
            <span className="film__episode">Episode {toRoman(film.episode_id)}</span>
            {!appears && <span className="visually-hidden">(does not appear)</span>}
          </li>
        )
      })}
    </ul>
  )
}
