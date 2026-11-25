interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="search">
      <label htmlFor="character-search" className="visually-hidden">
        Search characters
      </label>
      <input
        id="character-search"
        type="search"
        className="search__input"
        placeholder="Search characters"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
