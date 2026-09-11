# StageRight — Live Event Operations Command Center

A single-screen operations dashboard that answers one question for a venue operations manager on show night: **"Are we ready for tonight?"**

StageRight surfaces an overall event-readiness score, prioritizes the specific issues that need a human decision, and lets the manager resolve an issue and watch readiness respond in real time. It's built around one core principle: **severity over averages** — a high overall percentage can never hide a critical blocker.

Built with React, TypeScript, Tailwind CSS v4, and shadcn/ui. Mock data only; state persists in the browser via `localStorage`.

---

## The core idea

Most operational tooling reports averages, which lets a healthy-looking aggregate mask a single show-stopping problem. StageRight inverts that.

Example: tonight needs 120 event staff, and 118 are confirmed — 98.3%. By percentage alone, staffing looks **Ready**. But one of the two missing people is the required **VIP Security Lead**, a *critical* role. Because a critical requirement is unmet, the Staffing category is **Action Required**, not Ready. The percentage doesn't get a vote.

Every category resolves to one of three states, driven by severity rules rather than a completion percentage:

- **Ready** — all critical requirements met, metrics within Ready thresholds
- **Watch** — all critical requirements met, but a non-critical item is incomplete
- **Action Required** — any critical requirement unmet (this always wins, regardless of the overall number)

The Issues Requiring Attention panel stays prominent no matter how high the readiness score climbs.

---

## Features

- **Event readiness dashboard** — an overall readiness score with a Ready / Watch / Action Required breakdown, framed by the guiding question "Are we ready for tonight?"
- **Issues Requiring Attention** — unresolved alerts sorted by severity, each deep-linking straight to its resolution flow
- **Operational grid** — all eight operational categories (Staffing, Security, Ticketing/Entry, Concessions, Parking, VIP, Merchandise, Venue/Facilities) with live status and one-line summaries
- **Category detail views** — per-category requirements, current-vs-target values, the status logic behind the state, and a plain-language "why this status now"
- **Issue resolution flows** — resolve the three seeded alerts (VIP staffing shortage, delayed merchandise delivery, offline scanner); readiness recomputes and the alert clears
- **Deterministic readiness engine** — pure, testable functions; the overall score is always derived, never stored as source of truth
- **Persistence** — resolutions survive a page refresh; a "Reset scenario" control restores the original starting state

### The golden path

The signature interaction, start to finish:

1. Sign in → dashboard reads **87%**, with 3 issues requiring attention
2. Open the VIP staffing alert
3. Assign an available, qualified staff member to the critical VIP Security Lead post
4. Readiness updates **87% → 91%**, and the alert clears

Resolving all three alerts brings readiness to roughly **95%** and the issues panel to its "all clear" state.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react |
| Routing | React Router |
| State | Zustand (with `localStorage` persistence) |
| Readiness logic | Pure functions in `src/lib` |
| Tests | Vitest |
| Data | Mock seed data — no backend |

---

## Getting started

Requires Node 20 or newer.

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# run the tests
npm test

# production build
npm run build
```

Then open the URL Vite prints (usually `http://localhost:5173`).

> Note: state persists in `localStorage`. To return to the original 87% / three-alert starting scenario, use the **Reset scenario** button in the header, or clear the site's `localStorage`.

---

## Project structure

```
src/
  app/            routes, layout/shell, auth guard
  components/     dashboard, category detail, resolution flows, shared UI
  data/           mock seed data (event, categories, alerts, staff roster)
  lib/            readiness engine (pure, tested)
  store/          Zustand store + persistence
docs/
  StageRight_PRD.md   full product requirements
```

---

## How readiness is calculated

Overall readiness is a weighted roll-up of the eight category scores:

```
overallReadiness = round( Σ (category.weight × category.readiness) )
```

The weights sum to 1.0, and the seed values are tuned so the starting scenario computes to 87% and resolving the VIP staffing blocker moves it to 91%. Category *status* (Ready / Watch / Action Required), however, is gated by critical requirements — not by the score — so a category can sit at a high readiness percentage and still be Action Required if a critical role is uncovered.

---

## Status

Feature-complete MVP. All flows are verified end to end: the golden path, all three resolutions, persistence, and scenario reset. The full specification lives in [`docs/StageRight_PRD.md`](docs/StageRight_PRD.md).
