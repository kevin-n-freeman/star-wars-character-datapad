import { render, screen, within } from '@testing-library/react'
import { createFakeClient, makePerson } from '../test/fakeClient'
import { toRoman } from '../domain/roman'
import { RelatedInfo } from './RelatedInfo'

const film = (episode: number, title: string) => ({
  title,
  episode_id: episode,
  release_date: '',
  url: `https://swapi.test/api/films/${episode}`,
})
const films = [film(4, 'A New Hope'), film(1, 'The Phantom Menace'), film(5, 'The Empire Strikes Back')]

const XWING = 'https://swapi.test/api/starships/12'
const BROKEN = 'https://swapi.test/api/starships/99'
const xwing = {
  name: 'X-wing',
  model: 'T-65 X-wing',
  manufacturer: 'Incom Corporation',
  crew: '1',
  passengers: '0',
  starship_class: 'Starfighter',
  url: XWING,
}

function region(name: RegExp) {
  return screen.getByRole('region', { name })
}

describe('RelatedInfo', () => {
  it('lists all films in episode order and marks the ones the character is not in', async () => {
    const person = makePerson({ name: 'Luke Skywalker', films: [films[0].url, films[2].url] })
    render(<RelatedInfo person={person} client={createFakeClient({ films })} />)

    const items = await within(region(/films/i)).findAllByRole('listitem')
    expect(items.map((li) => li.querySelector('.film__title')?.textContent)).toEqual([
      'The Phantom Menace',
      'A New Hope',
      'The Empire Strikes Back',
    ])
    expect(items[0]).toHaveTextContent(/does not appear/i)
    expect(items[1]).not.toHaveTextContent(/does not appear/i)
    expect(items[1]).toHaveTextContent('Episode IV')
  })

  it('shows starship details and an empty state for vehicles', async () => {
    const person = makePerson({ name: 'Luke Skywalker', starships: [XWING], vehicles: [] })
    render(<RelatedInfo person={person} client={createFakeClient({ films, resources: { [XWING]: xwing } })} />)

    const starships = region(/starships/i)
    expect(await within(starships).findByText('X-wing')).toBeInTheDocument()
    expect(within(starships).getByText('1 / 0')).toBeInTheDocument()
    expect(within(starships).getByText('T-65 X-wing / Incom Corporation')).toBeInTheDocument()
    expect(within(region(/vehicles/i)).getByText('None listed')).toBeInTheDocument()
  })

  it('still shows the starships that loaded when one fails', async () => {
    const person = makePerson({ name: 'Luke Skywalker', starships: [XWING, BROKEN] })
    const client = createFakeClient({ films, resources: { [XWING]: xwing, [BROKEN]: new Error('boom') } })
    render(<RelatedInfo person={person} client={client} />)

    const starships = region(/starships/i)
    expect(await within(starships).findByText('X-wing')).toBeInTheDocument()
    expect(within(starships).getByText(/1 of 2 starships could not be loaded/i)).toBeInTheDocument()
  })

  it('shows "None listed" when the character has no films', async () => {
    render(<RelatedInfo person={makePerson({ name: 'Nobody', films: [] })} client={createFakeClient({ films })} />)

    expect(await within(region(/films/i)).findByText('None listed')).toBeInTheDocument()
  })

  it('shows a retryable error when the film list fails', async () => {
    const person = makePerson({ name: 'Luke Skywalker', films: [films[0].url] })
    render(<RelatedInfo person={person} client={createFakeClient({ films: new Error('boom') })} />)

    expect(await within(region(/films/i)).findByText(/films could not be loaded/i)).toBeInTheDocument()
  })
})

describe('toRoman', () => {
  it('converts episode numbers', () => {
    expect([1, 4, 6, 9].map(toRoman)).toEqual(['I', 'IV', 'VI', 'IX'])
  })
})
