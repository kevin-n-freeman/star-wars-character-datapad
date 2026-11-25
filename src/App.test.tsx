import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ApiError } from './api/swapiClient'
import { createFakeClient, makePerson } from './test/fakeClient'

describe('App: character list', () => {
  it('shows a loading state, then the characters sorted by name', async () => {
    const client = createFakeClient({
      people: [makePerson({ name: 'Yoda' }), makePerson({ name: 'Anakin Skywalker' })],
    })
    render(<App client={client} />)

    expect(screen.getByText(/loading characters/i)).toBeInTheDocument()

    const list = await screen.findByRole('list', { name: /characters/i })
    const names = Array.from(list.querySelectorAll('li')).map((li) => li.textContent)
    expect(names).toEqual(['Anakin Skywalker', 'Yoda'])
  })

  it('shows an error with a retry button when characters fail to load', async () => {
    const client = createFakeClient({ people: new ApiError('Could not reach the Star Wars API.') })
    render(<App client={client} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach/i)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows an empty state when the API returns no characters', async () => {
    render(<App client={createFakeClient({ people: [] })} />)

    expect(await screen.findByText(/no characters are available/i)).toBeInTheDocument()
  })

  it('prompts the user to select a character, then shows the selected name', async () => {
    const user = userEvent.setup()
    render(<App client={createFakeClient({ people: [makePerson({ name: 'Luke Skywalker' })] })} />)

    expect(screen.getByText(/select a character/i)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Luke Skywalker' }))

    expect(screen.getByRole('heading', { level: 2, name: 'Luke Skywalker' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Luke Skywalker' })).toHaveAttribute('aria-pressed', 'true')
  })
})
