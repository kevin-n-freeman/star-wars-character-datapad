import { render, screen, within } from '@testing-library/react'
import { createFakeClient, makePerson } from '../test/fakeClient'
import { CharacterDetails } from './CharacterDetails'

const TATOOINE = 'https://swapi.test/api/planets/1'
const HUMAN = 'https://swapi.test/api/species/1'

const tatooine = {
  name: 'Tatooine',
  population: '200000',
  terrain: 'desert',
  climate: 'arid',
  surface_water: '1',
  diameter: '10465',
  rotation_period: '23',
  orbital_period: '304',
  gravity: '1 standard',
  url: TATOOINE,
}

const human = {
  name: 'Human',
  classification: 'mammal',
  designation: 'sentient',
  average_height: '180',
  average_lifespan: '120',
  language: 'Galactic Basic',
  url: HUMAN,
}

function section(name: RegExp) {
  return screen.getByRole('region', { name })
}

describe('CharacterDetails', () => {
  it('shows formatted attributes, species and homeworld', async () => {
    const person = makePerson({ name: 'Luke Skywalker', homeworld: TATOOINE, species: [HUMAN] })
    const client = createFakeClient({ resources: { [TATOOINE]: tatooine, [HUMAN]: human } })
    render(<CharacterDetails person={person} client={client} />)

    expect(within(section(/attributes/i)).getByText('172 cm')).toBeInTheDocument()
    expect(await within(section(/species/i)).findByText('Human')).toBeInTheDocument()
    expect(await within(section(/homeworld/i)).findByText('Tatooine')).toBeInTheDocument()
    expect(within(section(/homeworld/i)).getByText('200,000')).toBeInTheDocument()
    expect(within(section(/homeworld/i)).getByText('10,465 km')).toBeInTheDocument()
  })

  it('explains the Star Wars birth-year format (BBY / ABY)', () => {
    render(<CharacterDetails person={makePerson({ name: 'Luke Skywalker' })} client={createFakeClient({})} />)

    const attributes = section(/attributes/i)
    expect(within(attributes).getByText('19BBY')).toBeInTheDocument()
    expect(within(attributes).getByText(/Years Before\(B\) or Years After\(A\) the Battle of Yavin/)).toBeInTheDocument()
  })

  it('shows "Unknown" instead of raw API placeholders', () => {
    const person = makePerson({ name: 'Mystery', mass: 'unknown', hair_color: 'n/a' })
    render(<CharacterDetails person={person} client={createFakeClient({})} />)

    const attributes = section(/attributes/i)
    expect(within(attributes).getByText('Unknown')).toBeInTheDocument()
    expect(within(attributes).getByText('N/A')).toBeInTheDocument()
  })

  it('shows "Unknown" when no species or homeworld is given', async () => {
    const person = makePerson({ name: 'Luke Skywalker', species: [], homeworld: '' })
    render(<CharacterDetails person={person} client={createFakeClient({})} />)

    expect(within(section(/species/i)).getByText('Unknown')).toBeInTheDocument()
    expect(await within(section(/homeworld/i)).findByText('Unknown')).toBeInTheDocument()
  })

  it('shows "Unknown" for homeworld details the API does not know', async () => {
    const person = makePerson({ name: 'Mystery', homeworld: TATOOINE })
    const unknownPlanet = { ...tatooine, name: 'unknown', population: 'unknown', terrain: 'unknown', climate: '' }
    render(<CharacterDetails person={person} client={createFakeClient({ resources: { [TATOOINE]: unknownPlanet } })} />)

    const homeworld = section(/homeworld/i)
    await within(homeworld).findByText('Population')
    expect(within(homeworld).getAllByText('Unknown').length).toBeGreaterThanOrEqual(4)
  })

  it('shows a retryable error when the homeworld fails to load', async () => {
    const person = makePerson({ name: 'Luke Skywalker', homeworld: TATOOINE })
    const client = createFakeClient({ resources: { [TATOOINE]: new Error('boom') } })
    render(<CharacterDetails person={person} client={client} />)

    const homeworld = section(/homeworld/i)
    expect(await within(homeworld).findByText(/could not be loaded/i)).toBeInTheDocument()
    expect(within(homeworld).getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
