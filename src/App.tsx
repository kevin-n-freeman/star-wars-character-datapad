import { useMemo, useState } from 'react'
import type { SwapiClient } from './api/swapiClient'
import type { SwapiPerson } from './api/types'
import { CharacterDetails } from './components/CharacterDetails'
import { RelatedInfo } from './components/RelatedInfo'
import { CharacterList } from './components/CharacterList'
import { SearchBox } from './components/SearchBox'
import { StatusMessage } from './components/StatusMessage'
import { filterCharacters } from './domain/search'
import { useAsync } from './hooks/useAsync'
import './App.css'

interface AppProps {
  /** Injected so tests can supply a fake API without network access. */
  client: SwapiClient
}

export default function App({ client }: AppProps) {
  const people = useAsync(() => client.getPeople(), [client])
  const [selected, setSelected] = useState<SwapiPerson | null>(null)
  const [query, setQuery] = useState('')

  const sortedPeople = useMemo(
    () =>
      people.status === 'success'
        ? [...people.data].sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [people],
  )
  const visiblePeople = useMemo(() => filterCharacters(sortedPeople, query), [sortedPeople, query])

  return (
    <div className="app">
      <header className="app__header">
        <h1>Star Wars Character Datapad</h1>
        <SearchBox value={query} onChange={setQuery} />
      </header>

      <main className="app__main">
        <section className="app__sidebar" aria-labelledby="characters-heading">
          <h2 id="characters-heading" className="section-title">
            Characters
          </h2>
          <div className="panel panel--list">
            {people.status === 'loading' && <StatusMessage kind="loading" message="Loading characters…" />}
            {people.status === 'error' && (
              <StatusMessage kind="error" message={people.error.message} onRetry={people.retry} />
            )}
            {people.status === 'success' && sortedPeople.length === 0 && (
              <StatusMessage kind="empty" message="No characters are available." />
            )}
            {people.status === 'success' && sortedPeople.length > 0 && visiblePeople.length === 0 && (
              <StatusMessage kind="empty" message={`No characters match "${query.trim()}".`} />
            )}
            {people.status === 'success' && visiblePeople.length > 0 && (
              <CharacterList
                characters={visiblePeople}
                selectedUrl={selected?.url ?? null}
                onSelect={setSelected}
              />
            )}
          </div>
        </section>

        <section className="app__detail" aria-label="Character details">
          <div className="panel">
            {selected ? (
              <CharacterDetails key={selected.url} person={selected} client={client} />
            ) : (
              <StatusMessage kind="empty" message="Select a character to see their details." />
            )}
          </div>
        </section>
      </main>

      {selected && <RelatedInfo key={selected.url} person={selected} client={client} />}
    </div>
  )
}
