# RAID Log: Star Wars Character Datapad

Risks, Assumptions, Issues and Dependencies for this project, kept by the delivery lead. It is the single tracked list. The [README](../README.md) explains the reasoning behind each decision, and the [Quality log](../README.md#quality-log-issues-found-and-how-they-were-resolved) records the fixes.

**Owners** are shown by role:
- **Delivery lead:** Kevin N. Freeman
- **Developer:** AI coding agent (Claude), working under the delivery lead's direction
- **Product owner:** to be confirmed by the client

**Status values:**
- **Risks:** Open, Mitigated or Closed
- **Assumptions:** Unvalidated, Validated or Invalidated
- **Issues:** Open, Resolved or Deferred
- **Dependencies:** Met or At risk

---

## Risks

| ID | Risk | Impact | Response | Owner | Status |
|---|---|---|---|---|---|
| R-01 | The free third-party API (swapi.info) is slow or unavailable | Users can't see any data | 10-second timeout, a clear error message and "Try again". Stand-in or stale data is never shown | Developer | Mitigated |
| R-02 | Request volume grows with heavier use. Each character needs several requests (about 8 for Luke) because related data arrives as links | Slower pages; more load on a free API | Requests run in parallel and every response is cached. With heavy traffic, add a small server that combines requests ([next steps](../README.md#what-i-would-do-next)) | Delivery lead | Mitigated for current scale |
| R-03 | One related item (for example, a starship) fails while others load | A whole section could appear broken | Shows the items that loaded, plus "1 of 2 could not be loaded" with a retry | Developer | Mitigated |
| R-04 | Accessibility not audited with a screen reader | Some users may have difficulty using the app | Semantic HTML, labels, live status messages and keyboard-accessible hints are in place. A screen-reader review is in next steps | Delivery lead | Open |
| R-05 | No real-browser end-to-end or visual regression tests | Layout problems could go unnoticed | 41 automated tests cover behavior. Layout was checked manually in Chrome. Playwright tests are in next steps | Delivery lead | Open |
| R-06 | The cache has no size limit or expiry | Memory use could grow with a much larger dataset | Acceptable for ~80 characters and static data. Adopting TanStack Query is in next steps | Developer | Open (low) |

## Assumptions

| ID | Assumption | If wrong | How validated | Owner | Status |
|---|---|---|---|---|---|
| A-01 | "Single-page view" means one screen layout for any character, with Luke as the wireframe's example | Scope would be misread | Read against the instructions, which say separate pages for films and vehicles are not required | Delivery lead | Validated |
| A-02 | An empty species list means "not provided", not "no species" | "Unknown" would be misleading | Checked against the API: Luke and Han Solo, both human, have empty species lists | Delivery lead | Validated |
| A-03 | swapi.info returns complete lists rather than pages | Some characters would be missing | API documentation. The client also accepts the paged format used by swapi.dev | Developer | Validated |
| A-04 | The full character list (~80) is small enough to load at once and search in the browser | Slow first load; search would need a server | List size checked in the API. Revisit if the data grows into the thousands | Delivery lead | Validated |
| A-05 | The list starts with no character selected | Minor difference from the wireframe, which shows Luke selected | Treated as illustrative. Easy to change if the product owner prefers | Delivery lead | Unvalidated: confirm with product owner |
| A-06 | A desktop-first layout matching the wireframe is sufficient | Poor experience on phones | Layout stacks on narrow screens. Full mobile design was out of scope | Delivery lead | Unvalidated: confirm with product owner |

## Issues

| ID | Issue | Response | Owner | Status |
|---|---|---|---|---|
| I-01 | The wireframe shows Luke as "Human", but the API returns no species for him | One display rule: "Unknown" for missing single values, "None listed" for empty lists, "N/A" where a value doesn't apply. See the [decision and options considered](../README.md#decision-unknown-species-even-when-the-answer-seems-obvious) | Delivery lead | Resolved |
| I-02 | Showing well-known humans (Han Solo, Luke) as "Unknown" feels wrong to users | Kept "Unknown" for consistency and maintainability. If the business prefers "Human", apply it once at the data level, not as per-character exceptions | Product owner | Deferred: product decision |
| I-03 | Birth years such as "19BBY" are unclear to non-fans | Added an "i" hint explaining BBY/ABY | Delivery lead | Resolved |
| I-04 | Empty starship and vehicle lists don't say whether that means "none" or "not recorded" | Display "None listed", which is true either way | Delivery lead | Resolved |
| I-05 | The API has a planet literally named "unknown"; card titles showed the raw text | Titles use the same formatting as other values and display "Unknown" (found by an automated test) | Developer | Resolved |
| I-06 | The difference between "Starships" and "Vehicles" isn't obvious to non-fans | Recorded as a future improvement: reuse the "i" hint to explain that starships have a hyperdrive | Delivery lead | Deferred: next steps |
| I-07 | A manual GitHub Pages deployment failed with a temporary GitHub error | Re-ran with no code change; it succeeded | Developer | Resolved |

## Dependencies

| ID | Dependency | Needed for | Owner | Status |
|---|---|---|---|---|
| D-01 | swapi.info availability | All live data in the app | Delivery lead (monitor) | Met |
| D-02 | GitHub Actions | Automated lint, type check, tests and build on every push | Developer | Met |
| D-03 | GitHub Pages | The live demo | Delivery lead | Met |
| D-04 | Node.js 20 or later on the reviewer's machine | Installing and running the app locally | Reviewer | Documented in the README |
| D-05 | Product owner decisions: species default (I-02), initial selection (A-05), mobile scope (A-06) | Closing the open items | Product owner | Pending |
