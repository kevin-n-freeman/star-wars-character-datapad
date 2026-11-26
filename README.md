# Star Wars Character Datapad

A single-page web app for exploring Star Wars characters using the [Star Wars API (swapi.info)](https://swapi.info/). Users can browse and search characters, select one to see their attributes, species and homeworld, and see the films they appear in and the starships and vehicles they pilot.

**Live demo:** https://kevin-n-freeman.github.io/star-wars-character-datapad/

> **How this was built.** I completed this exercise in the persona agreed with LiminalArc: a **delivery lead directing a developer**. I planned and prioritized the work as GitHub issues with estimates, set the requirements and acceptance criteria, and reviewed, tested and accepted each piece. An AI coding agent (Claude) acted as the developer and wrote the code under that direction. Every commit is marked as co-authored by Claude. See [How AI was used](#how-ai-was-used-and-validated).

> **Finding: the wireframe and the API disagree.** The wireframe shows Luke Skywalker's species as "Human", but the API returns *no* species for him (it leaves species empty for most humans). Rather than invent data the API doesn't provide, the app follows one consistent display rule:
>
> - **"Unknown"** for a single value that is missing or marked unknown: attributes, species, homeworld and homeworld details. Every character has a species and a homeworld; we just aren't told which.
> - **"None listed"** for an empty list: films, starships and vehicles. An empty list may mean "pilots nothing" or "not recorded", and the API doesn't say which, so the wording claims neither.
> - **"N/A"** where the API says a value doesn't apply (for example, a droid's hair color).
>
> When there is **no record at all** (no species given), the app says "Unknown" once, rather than listing six fields that would all read "Unknown". When there **is** a record with gaps (a homeworld with an unknown population), the app shows the record and marks each gap.

---

## Contents

- [Running the app](#running-the-app)
- [Running the tests](#running-the-tests)
- [Requirements coverage](#requirements-coverage)
- [API conditions found](#api-conditions-found-and-how-the-app-handles-them)
- [Work plan](#work-plan)
- [Technical approach and architecture](#technical-approach-and-architecture)
- [Key decisions, tradeoffs and alternatives](#key-decisions-tradeoffs-and-alternatives)
- [Assumptions](#assumptions)
- [Risks and limitations](#risks-and-limitations)
- [What I would do next](#what-i-would-do-next)
- [How AI was used and validated](#how-ai-was-used-and-validated)
- [Quality log](#quality-log-issues-found-and-how-they-were-resolved)
- [Guidance for the next engineer](#guidance-for-the-next-engineer)
- [RAID log](docs/RAID.md) (risks, assumptions, issues and dependencies, tracked in one place)

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

The tests never call the real API. They use an in-memory fake client (`src/test/fakeClient.ts`) or a mocked `fetch`, so they are fast and repeatable and don't fail when swapi.info is slow or down.

**The sample data is used only by the tests, never by the running app.** The app always shows live data from swapi.info. If the API is unavailable, users see a clear error with a "Try again" button, never stand-in or outdated data. The tests check *behavior* (does the page display what it receives, handle missing values and show errors correctly), not whether the API's facts are correct. GitHub Actions runs lint, type check, tests and build on every push (`.github/workflows/ci.yml`).

---

## Requirements coverage

| Requirement from the exercise | Where it is delivered |
|---|---|
| View a list of characters | #3: sorted, scrollable list |
| Search for a character | #4: filters as you type; clear message when nothing matches |
| Select a character and view details, species and homeworld | #3 (selection) and #5 (attributes, species, homeworld) |
| View films, starships and vehicles | #6 |
| Clearly communicate loading, empty and error states | Acceptance criteria on #3, #4, #5 and #6, with error handling and retries in #2 |

"Single-page view" is read as one screen layout that works for any character, with Luke Skywalker as the wireframe's example. Films, starships and vehicles are shown on that page, not on separate pages, per the instructions.

---

## API conditions found and how the app handles them

While building and reviewing the app, I checked the wireframe against what the API actually returns. Each condition below was found in the data or the API's behavior, and the app handles it deliberately.

| Condition found | What the app does | Why |
|---|---|---|
| Every value is text, even numbers (`"172"`, `"200000"`) | Formats values with units and thousands separators (172 cm, 200,000) | Readable values; no raw API text on screen |
| Some numbers already contain commas (Jabba the Hutt's mass is `"1,358"`) | The formatter accepts both forms | Avoids showing "NaN" or a wrong number |
| Missing values arrive as `"unknown"`, `"n/a"` or empty | One display rule: "Unknown", "N/A", "None listed" (see Finding above) | Consistent and honest; never invents data |
| Species is empty for most humans, including Luke, though the wireframe shows "Human" | Shows "Unknown" | The API doesn't say; guessing would be wrong for some characters |
| No species record at all vs. a record with some unknown fields | Shows a single "Unknown" vs. the record with each gap marked | Avoids rows of repeated "Unknown" that suggest data exists when it doesn't |
| The API has a planet literally named `"unknown"` | Displays it as "Unknown", like every other missing value | Found by an automated test (see Quality log) |
| Empty starship or vehicle lists don't say whether that means "none" or "not recorded" | Shows "None listed" | Neutral wording that is true in both cases |
| Birth years use the Star Wars calendar (`19BBY`, `41.9BBY`) | Adds an "i" explaining BBY / ABY | Correct data, but unclear to non-fans |
| Related data (species, planet, ships) arrives as links, not details | Loads them in parallel and caches every response | Keeps the page fast; revisits cost no requests |
| The full character list (~80) comes back in one response, with no paging | Loads the list once when the page opens | Simple and instant at this size |
| The API has no search feature | Filters the loaded list in the browser, ignoring case and accents | Instant results with no extra requests |
| One film list covers the whole saga | Shows all films and dims the ones the character isn't in, as in the wireframe | One shared request instead of one per film |
| The original swapi.dev returns lists in pages (`{ results }`); swapi.info returns plain lists | The client accepts both | Switching API hosts won't break the app |
| A free third-party API can be slow or down | 10-second timeout, a clear error and "Try again". No stand-in data is ever shown | Users always know what happened |
| A single related item can fail while others load | Shows the items that loaded, plus "1 of 2 could not be loaded" | One bad link doesn't blank a whole section |

---

## Work plan

The work was broken into GitHub issues, each estimated before starting and closed by the commit that delivered it.

| Issue | Scope | Estimate | Why it matters |
|---|---|---|---|
| #1 | Project setup: React + TypeScript, test runner, CI | 0.5 h | A widely used stack, so any team can maintain it |
| #2 | API layer: one module for all API calls, with error handling and caching | 1.0 h | The API returns related data as links, so one character needs several requests (about 8 for Luke). Loading them in parallel and caching keeps the page fast |
| #3 | Character list and selection, with loading, empty and error states | 0.5 h | The API returns all ~80 characters in one response, so the list loads once and stays fast |
| #4 | Character search | 0.5 h | The API has no search feature, so search filters the loaded list in the browser, instantly |
| #5 | Details: attributes, species, homeworld | 1.0 h | The API often marks values unknown or leaves species empty, so values are shown consistently as "Unknown" (see Finding above) |
| #6 | Films, starships and vehicles | 1.0 h | Many characters have no starships or vehicles listed, so each section shows "None listed" rather than an empty box |
| #7 | Automated tests for the API layer and key screens | 1.0 h | Tests use saved sample data so they give the same result every run, even if the API is slow or down |
| #8 | README | 0.5 h | Required: install, run and test instructions, plus decisions and tradeoffs |
| #9 | *Stretch:* live demo on GitHub Pages | 0.5 h | Bonus: reviewers can try the app in a browser without installing it. Install steps remain in this README |

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

### Decision: "Unknown" species, even when the answer seems obvious

Showing Han Solo's or Luke Skywalker's species as "Unknown" feels wrong. Everyone knows they are human. The API simply doesn't record it. I weighed three options:

| Option | Pros | Cons |
|---|---|---|
| 1. Treat every empty species as "Human" | Looks right for Han and Luke | Becomes silently wrong for any non-human character the API left blank. The app would be stating something its data source does not |
| 2. Keep a hand-maintained list of characters known to be human | Correct for the characters on the list | A growing list of exceptions that someone has to maintain. It drifts from the source data, and every new character needs a manual decision |
| 3. **Show "Unknown" consistently** *(chosen)* | One simple rule, applied everywhere. The app never claims more than the data says | Some results look odd to fans, as with Han Solo |

**Why option 3:** consistency and maintainability. One rule covers every character, today and as more are added, with no exception list to maintain. The app is only as accurate as its data source, and it says so plainly instead of hiding gaps.

**If the business wants "Human" shown:** the right fix is at the data level, not in the screen code. That could be a product-owner decision to apply one documented default (a single change in one place) or a small data-enrichment step. Either way the rule stays in one place and is easy to find, test and reverse.

## Assumptions

*All assumptions, risks, issues and dependencies are tracked with owners and status in the [RAID log](docs/RAID.md). This section and the next explain the reasoning.*

- **Empty species means "not provided", not "no species".** The API leaves species empty for most humans, including Luke Skywalker, even though the wireframe shows "Human". The app shows "Unknown" rather than guessing "Human", because guessing would be wrong for some characters. If the product owner prefers, defaulting empty species to "Human" is a small change in `CharacterDetails.tsx`.
- **swapi.info returns full lists, not pages.** The client also accepts the paginated `{ results }` shape used by the original swapi.dev, so switching hosts won't break it.
- **The character list is small enough to load at once** (~80 records), which is what makes browser-side search reasonable.
- **Missing values follow one display rule** ("Unknown", "None listed", "N/A"), described in the Finding at the top, so users never see raw API text like "unknown" or blank boxes.
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

The instructions note that reviewers "do not expect you to implement every improvement you identify." I implemented the improvements that affected correctness or basic usability (for example, the birth-year explanation) and recorded the rest here as improvements for future consideration, in priority order:

1. **Put the selected character in the URL** (`?character=1`) so views can be shared and the back button works.
2. **Adopt TanStack Query** if the app grows. It would replace `useAsync` and the hand-written cache with a well-tested library (background refresh, cache limits, request cancellation).
3. **Add a small set of real-browser end-to-end tests** (Playwright) for the main journey, plus an automated accessibility check (axe).
4. **Keyboard navigation in the character list** (arrow keys) and an accessibility review with a screen reader.
5. **Typo-tolerant search,** so "Chewbaca" still finds Chewbacca.
6. **Product decision on empty species** (show "Human" or keep "Unknown"), confirmed with the product owner. If "Human" is preferred, apply it once at the data level (see the decision above), not as per-character exceptions.
7. **Explain "Unknown" where it might surprise users,** for example a small note that the Star Wars API does not record a species for this character.
8. **Explain "Starships" vs. "Vehicles"** with the same "i" hint used for birth year. Identified during delivery lead review: the difference isn't obvious to non-fans. In the Star Wars API, starships have a hyperdrive for travel between star systems; vehicles operate on or near a planet (for example, the X-wing is a starship and the Snowspeeder is a vehicle, though both are made by Incom). This reuses the existing hint, so it's a small change.

## How AI was used and validated

**Roles.** I acted as the delivery lead. An AI coding agent (Claude) acted as the developer.

**What I did:**
- Decomposed the work into issues with estimates and identified the risks up front (request volume, missing data, API reliability).
- Set the requirements for each issue: wireframe fidelity; loading, empty and error states; and tests that never depend on the live API.
- Reviewed each change before accepting it, ran the tests, and checked the app visually against the wireframe.
- Made the judgment calls, for example the display rule for missing data ("Unknown" for single values, "None listed" for empty lists) rather than guessing "Human", and keeping the dependency list small.

**How the output was validated:**
- **Automated checks on every change:** lint, type check, 41 tests, and a production build. GitHub Actions repeats these on every push.
- **Visual check:** the built app was run against local sample data in Chrome and compared with the wireframe.
- **Corrections during review:** for example, a test for an "unknown" homeworld caught that card titles showed the raw API text "unknown" instead of "Unknown", which was then fixed. Also, the linter flagged that the first version of the loading hook updated state in a way React discourages. It was rewritten so a slow response for a previous character can never overwrite the current one, and a test was added to prove it.

**Accountability.** I reviewed the code with the agent explaining each part in plain language, and I can walk through the architecture, testing strategy and tradeoffs described here.

## Quality log: issues found and how they were resolved

Every push runs lint, type checks, all tests and a production build in GitHub Actions. The full run history is under the repository's [Actions tab](https://github.com/kevin-n-freeman/star-wars-character-datapad/actions). The issues below were caught by those checks or by my review, and each was resolved before being accepted.

| # | Found by | What was found | How it was resolved | Commit |
|---|---|---|---|---|
| 1 | Linter | The first version of the loading hook updated React state in a way React discourages, which could cause extra re-renders | Hook rewritten so results are tied to the request that produced them. Added a test proving a slow response for a previous character can never overwrite the current one | `eb50ce5` |
| 2 | Delivery lead review | The wireframe shows Luke as "Human", but the API returns no species for him | Adopted one display rule for missing data ("Unknown" for single values, "None listed" for empty lists) rather than inventing data. Documented as a Finding at the top of this README | `1fe363f` |
| 3 | Automated test | A new test for an unknown homeworld failed: card titles showed the API's raw text "unknown" | Titles now use the same formatting as other values and display "Unknown" | `1fe363f` |
| 4 | Delivery lead review | "Single-page view" could be read as Luke's page only | Clarified as one screen layout for any character, and added a requirements coverage table | `b41f05e` |
| 5 | Delivery lead review | Work plan notes read like a list of problems rather than design reasons | Column renamed "Why it matters" and entries reworded | `8e5b0dc` |
| 6 | Delivery lead review | Risk that readers think sample data could be shown to users when the API is down | Clarified that sample data is used only by the tests; the app always uses the live API and shows an error instead | `8e5b0dc` |
| 7 | GitHub Actions | One manual GitHub Pages deployment failed with a temporary GitHub error (deployment artifact not found) | Re-ran the deployment with no code change; it succeeded | n/a |
| 8 | Delivery lead review (live demo) | Birth years such as "19BBY" and "41.9BBY" are correct but unclear to anyone who doesn't know the Star Wars calendar. A usability gap, not a data error | Added a small "i" next to "Birth year" that explains BBY / ABY (before / after the Battle of Yavin) on hover or keyboard focus, and to screen readers | `a08999a` |

## Guidance for the next engineer

- **Start with `src/App.tsx`** for the page layout, then `src/api/swapiClient.ts` for how data is fetched.
- **Never call `fetch` from a component.** Add a method to the API client instead, so error handling, timeouts and caching stay in one place.
- **Put display logic in `src/domain/`** as plain functions. They're the easiest code to test.
- **To add a new section** (for example, a character's homeworld residents): use `useAsync` with a client method, and handle all three states (loading, empty, error) with `StatusMessage`.
- **Write tests with `createFakeClient`** (`src/test/fakeClient.ts`): describe the data as a map of URL to object. No network mocking is needed.
- **CI must stay green.** Lint, type check, tests and build all run on every push.
