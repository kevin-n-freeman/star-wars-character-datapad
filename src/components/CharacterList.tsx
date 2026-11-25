import type { SwapiPerson } from '../api/types'

interface CharacterListProps {
  characters: SwapiPerson[]
  selectedUrl: string | null
  onSelect: (person: SwapiPerson) => void
}

export function CharacterList({ characters, selectedUrl, onSelect }: CharacterListProps) {
  return (
    <ul className="character-list" aria-label="Characters">
      {characters.map((person) => {
        const selected = person.url === selectedUrl
        return (
          <li key={person.url}>
            <button
              type="button"
              className={`character-list__item${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(person)}
            >
              {person.name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
