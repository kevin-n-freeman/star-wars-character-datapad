import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { createSwapiClient } from './api/swapiClient'
import './index.css'

// Optional override (e.g. a local mock or mirror); defaults to swapi.info.
const client = createSwapiClient({ baseUrl: import.meta.env.VITE_SWAPI_BASE_URL || undefined })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>,
)
