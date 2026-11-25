import { makePerson } from '../test/fakeClient'
import { filterCharacters } from './search'

const people = [
  makePerson({ name: 'Luke Skywalker' }),
  makePerson({ name: 'Anakin Skywalker' }),
  makePerson({ name: 'Padmé Amidala' }),
  makePerson({ name: 'Yoda' }),
]

describe('filterCharacters', () => {
  it('returns everyone for an empty or blank query', () => {
    expect(filterCharacters(people, '')).toHaveLength(4)
    expect(filterCharacters(people, '   ')).toHaveLength(4)
  })

  it('matches anywhere in the name, ignoring case', () => {
    expect(filterCharacters(people, 'SKY').map((p) => p.name)).toEqual(['Luke Skywalker', 'Anakin Skywalker'])
  })

  it('ignores accents', () => {
    expect(filterCharacters(people, 'padme').map((p) => p.name)).toEqual(['Padmé Amidala'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterCharacters(people, 'jar jar')).toEqual([])
  })
})
