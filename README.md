# Star Wars Character Datapad

A single-page web app for exploring Star Wars characters using the [Star Wars API (swapi.info)](https://swapi.info/). Users can browse and search characters, select one to see their attributes, species and homeworld, and see the films they appear in and the starships and vehicles they pilot.

**Live demo:** https://kevin-n-freeman.github.io/star-wars-character-datapad/

> **How this was built.** I completed this exercise in the persona agreed with LiminalArc: a **delivery lead directing a developer**. I planned and prioritized the work as GitHub issues with estimates, set the requirements and acceptance criteria, and reviewed, tested and accepted each piece. An AI coding agent (Claude) acted as the developer and wrote the code under that direction. Every commit is marked as co-authored by Claude. See [How AI was used](#how-ai-was-used-and-validated).

---

## Contents

- [Running the app](#running-the-app)
- [Running the tests](#running-the-tests)
- [Work plan](#work-plan)
- [Technical approach and architecture](#technical-approach-and-architecture)
- [Key decisions, tradeoffs and alternatives](#key-decisions-tradeoffs-and-alternatives)
- [Assumptions](#assumptions)
- [Risks and limitations](#risks-and-limitations)
- [What I would do next](#what-i-would-do-next)
- [How AI was used and validated](#how-ai-was-used-and-validated)
- [Guidance for the next engineer](#guidance-for-the-next-engineer)

---

## Running the app

**Prerequisites:** [Node.js](https://nodejs.org/) 20 or later (22 recommended).

```bash
git clone https://github.com/kevin-n-freeman/star-wars-character-datapad.git
cd star-wars-character-datapad
npm install
npm run dev
```

Then open the address shown in the terminal (usually http://localhost:5173).

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds a production bundle into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Lints the code (oxlint) |
| `npm run typecheck` | Runs the TypeScript compiler |

**Optional:** set `VITE_SWAPI_BASE_URL` to point the app at a different API host (for example a local mock or mirror). It defaults to `https://swapi.info/api`.

## Running the tests

```bash
npm test            # run the full suite once
npm run test:watch  # re-run tests as files change
```

The tests never call the real API. They use an in-memory fake client (`src/test/fakeClient.ts`) or a mocked `fetch`, so they are fast and repeatable and don't fail when swapi.info is slow or down. GitHub Actions runs lint, type check, tests and build on every push (`.github/workflows/ci.yml`).

---

## Work plan

The work was broken into GitHub issues, each estimated before starting and closed by the commit that delivered it.

| Issue | Scope | Estimate | Key risk or note |
|---|---|---|---|
| #1 | Project setup: React + TypeScript, test runner, CI | 0.5 h | Mainstream stack to keep the team learning curve low |
| #2 | API layer: one module for all API calls, with error handling and caching | 1.0 h | **Main risk:** related data is linked by URL, so one character can trigger 10+ requests |
| #3 | Character list with loading, empty and error states | 0.5 h | The API returns all ~80 characters at once (no paging) |
| #4 | Character search | 0.5 h | The API has no search endpoint |
| #5 | Details: attributes, species, homeworld | 1.0 h | "unknown" / "n/a" values; species is often empty |
| #6 | Films, starships and vehicles | 1.0 h | Many characters pilot nothing, so empty states matter |
| #7 | Automated tests for the API layer and key screens | 1.0 h | Tests must not depend on the live API |
| #8 | README | 0.5 h | Required deliverable |
| #9 | *Stretch:* live demo on GitHub Pages | 0.5 h | Lets reviewers try it without installing anything |

**Total estimate:** about 6.5 hours, more than the "few hours" guidance. I treated #1–#8 as the core and #9 as a stretch goal, and wrote tests alongside each feature rather than leaving them to the end.

---

## Technical approach and architecture

**Stack:** React 19 + TypeScript, built with Vite. Tests use Vitest and React Testing Library. There are no other runtime dependencies.

The code is organized into layers, each with one job:

```
src/
├── api/            Talking to the Star Wars API
│   ├── types.ts          Raw response shapes, exactly as the API sends them
│   └── swapiClient.ts    The ONLY code that makes network requests
├── domain/         Pure logic, no React, no network (easy to test)
│   ├── format.ts         Turns raw values like "200000" or "unknown" into display text
│   ├── search.ts         Character search filtering
│   └── roman.ts          Episode numbers as Roman numerals
├── hooks/
│   └── useAsync.ts       Loading / success / error state for any request
├── components/     What the user sees
│   ├── CharacterList, SearchBox
│   ├── CharacterDetails  Attributes, species, homeworld
│   ├── RelatedInfo       Films, starships, vehicles
│   └── StatusMessage, InfoTable, FilmStrip, CraftList (shared building blocks)
├── test/           Test helpers (fake API client, sample data)
└── App.tsx         Page layout and state (selected character, search text)
```

**How data flows:**

1. `main.tsx` creates the API client and passes it to `App`. Passing it in, rather than importing it directly, is what lets tests substitute a fake.
2. `App` loads the character list once. Search filters that list in the browser.
3. When a character is selected, each section (species, homeworld, films, starships, vehicles) loads its own data in parallel and shows its own loading, empty or error state. One slow or failed section never blocks the others.
4. Every response is cached by URL, so revisiting a character, or a planet or film shared by several characters, costs no extra requests.

## Key decisions, tradeoffs and alternatives

| Decision | Why | Alternatives considered |
|---|---|---|
| **React + TypeScript + Vite** | A widely used, well-documented stack that most teams can maintain. TypeScript catches mistakes in API data handling early. | Plain JavaScript (simpler, but fewer safety checks); Next.js (server features this app doesn't need) |
| **One API client module** | All network behavior (timeouts, errors, caching) lives in one tested place. Components never call `fetch` directly. | Calling `fetch` inside components: faster to write, but duplicates error handling and is hard to test |
| **In-memory cache in the client** | SWAPI data is static and heavily shared (most characters share films and planets), so caching removes most repeat requests. Failures are *not* cached, so "Try again" works. | A data-fetching library (TanStack Query, SWR): more features, but an extra dependency that is more than this app needs (see next steps) |
| **Search in the browser** | swapi.info has no search endpoint, and the full list is small (~80 records). Filtering locally is instant and needs no extra requests. | Server-side search (not available); a debounced search against swapi.dev's `?search=` (an extra dependency on a different host) |
| **Each section loads independently** | A missing starship or slow planet shouldn't blank the whole page. If some items in a list fail, the rest still show with "1 of 2 could not be loaded". | Load everything, then render: simpler, but one failure would break the whole view |
| **Show all films, dim the ones the character isn't in** | Matches the wireframe. Uses one cached `/films` request instead of one request per film. | Show only the character's films (fewer items, but loses the wireframe's context) |
| **No routing or state library** | One page with two pieces of state (selected character, search text), so plain React state is enough. | React Router (useful later for shareable links per character); Redux/Zustand (unneeded at this size) |
| **Placeholders instead of images** | The instructions say images are optional, and SWAPI doesn't provide any. | Third-party image sources (licensing and reliability risk) |

## Assumptions

- **Species is often empty in the API.** SWAPI leaves the species list empty for most humans, including Luke Skywalker, even though the wireframe shows "Human". I show "No species listed for this character" rather than assuming "Human". The data doesn't say it, and guessing would be wrong for some characters. If the product owner prefers, defaulting empty species to "Human" is a one-line change in `CharacterDetails.tsx`.
- **swapi.info returns full lists, not pages.** The client also accepts the paginated `{ results }` shape used by the original swapi.dev, so switching hosts won't break it.
- **The character list is small enough to load at once** (~80 records), which is what makes browser-side search reasonable.
- **"unknown", "n/a" and empty values** are shown as "Unknown", "N/A" and "None" rather than raw API text.
- **Desktop-first layout** matching the wireframe, with simple stacking for narrow screens. Full mobile design was out of scope.
- **The list starts with no character selected,** with a prompt to choose one. The wireframe shows Luke selected, but that appears to be illustrative.

## Risks and limitations

- **Dependence on a free third-party API.** If swapi.info is slow or down, the app shows clear error messages with "Try again", but it cannot show data. Requests time out after 10 seconds.
- **Many requests per character.** One character can trigger 10+ requests (species, planet, each starship and vehicle). Caching and parallel loading keep this fast. An app with heavier traffic would want a backend that combines these.
- **The cache lasts only for the browser session** and has no size limit. That's fine for this dataset; a larger dataset would need limits or expiry.
- **Selection isn't in the URL,** so a specific character can't be bookmarked or shared yet.
- **Accessibility was considered but not audited.** The app uses semantic HTML, labels and live regions for status messages, but hasn't been tested with a screen reader.
- **No visual regression or real-browser end-to-end tests.** Layout was checked manually in Chrome.

## What I would do next

In priority order:

1. **Put the selected character in the URL** (`?character=1`) so views can be shared and the back button works.
2. **Adopt TanStack Query** if the app grows. It would replace `useAsync` and the hand-written cache with a well-tested library (background refresh, cache limits, request cancellation).
3. **Add a small set of real-browser end-to-end tests** (Playwright) for the main journey, plus an automated accessibility check (axe).
4. **Keyboard navigation in the character list** (arrow keys) and an accessibility review with a screen reader.
5. **Product decision on empty species** (show "Human" or keep "No species listed"), confirmed with the product owner.

## How AI was used and validated

**Roles.** I acted as the delivery lead. An AI coding agent (Claude) acted as the developer.

**What I did:**
- Decomposed the work into issues with estimates and identified the risks up front (request volume, missing data, API reliability).
- Set the requirements for each issue: wireframe fidelity; loading, empty and error states; and tests that never depend on the live API.
- Reviewed each change before accepting it, ran the tests, and checked the app visually against the wireframe.
- Made the judgment calls, for example showing "No species listed" rather than guessing "Human", and keeping the dependency list small.

**How the output was validated:**
- **Automated checks on every change:** lint, type check, 38 tests, and a production build. GitHub Actions repeats these on every push.
- **Visual check:** the built app was run against local sample data in Chrome and compared with the wireframe.
- **Corrections during review:** for example, the linter flagged that the first version of the loading hook updated state in a way React discourages. It was rewritten so a slow response for a previous character can never overwrite the current one, and a test was added to prove it.

**Accountability.** I reviewed the code with the agent explaining each part in plain language, and I can walk through the architecture, testing strategy and tradeoffs described here.

## Guidance for the next engineer

- **Start with `src/App.tsx`** for the page layout, then `src/api/swapiClient.ts` for how data is fetched.
- **Never call `fetch` from a component.** Add a method to the API client instead, so error handling, timeouts and caching stay in one place.
- **Put display logic in `src/domain/`** as plain functions. They're the easiest code to test.
- **To add a new section** (for example, a character's homeworld residents): use `useAsync` with a client method, and handle all three states (loading, empty, error) with `StatusMessage`.
- **Write tests with `createFakeClient`** (`src/test/fakeClient.ts`): describe the data as a map of URL to object. No network mocking is needed.
- **CI must stay green.** Lint, type check, tests and build all run on every push.
