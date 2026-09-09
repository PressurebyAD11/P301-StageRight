# StageRight — Live Event Operations Command Center
### Product Requirements Document (MVP)

| | |
|---|---|
| **Doc status** | Draft v0.1 |
| **Date** | September 4, 2026 |
| **Build target** | React + TypeScript + shadcn/ui + Tailwind, mock data, `localStorage` persistence |
| **Dev environment** | VS Code + GitHub Copilot agent |
| **Source concept** | P301 — StageRight brief (`Protogen_App_Ideas.pdf`) |

**Scope decisions locked from kickoff:** Working MVP with *several interactive flows* — the VIP staffing golden path, all three alerts resolvable, all eight operational categories with drill-down detail views, and state persisted locally between refreshes.

---

## 1. Overview

### 1.1 Problem
A venue operations manager running a 20,000-seat arena on show night has to hold eight interdependent operational domains in their head at once — staffing, security, ticketing, concessions, parking, VIP, merchandise, facilities — and answer a single question under time pressure: **"Are we ready for tonight?"** Existing tooling tends to report *averages* (spreadsheets, siloed dashboards), which lets a healthy-looking aggregate hide a single critical blocker. The manager needs to find the thing that will actually stop the doors from opening, not admire a green number.

### 1.2 Product vision
One command-center screen that answers "Are we ready?" at a glance, surfaces the specific issues that need a human decision, and lets the manager resolve an issue and immediately see readiness respond. The signature interaction is **dashboard → identify problem → resolve → dashboard updates**.

### 1.3 Target user (persona)
**Morgan — Venue Operations Manager.** Runs the floor on event nights from an ops room on a large monitor. Comfortable with dense information, low tolerance for clicks that don't change anything, needs to triage fast in the 2–4 hours before doors. Success for Morgan = walking into doors-open with zero unresolved critical blockers.

### 1.4 Goals
- Communicate overall event readiness in under two seconds of looking.
- Never let a high aggregate mask a critical blocker (the core principle, §3).
- Make every surfaced issue *actionable* — one click from the alert to the place it gets resolved.
- Demonstrate a clean, deterministic end-to-end loop where resolving an issue moves the readiness number.

### 1.5 Non-goals (explicitly out of scope for MVP)
Real backend or database; real authentication/authorization; multiple concurrent events or event history; real device/IoT or vendor integrations; push notifications, SMS, or email; multi-user collaboration or roles beyond the single manager; mobile-first layout (desktop-first is fine); analytics/reporting exports; theming beyond the single command-center theme.

---

## 2. The reviewer acceptance test (golden path)

This is the canonical end-to-end flow the MVP must nail. It doubles as the primary acceptance test.

1. Manager logs in (mock).
2. Lands on the dashboard for tonight's event ("The Nova Tour").
3. Sees **Event Readiness 87%** and **3 issues require attention**.
4. Selects the **VIP entrance understaffed** alert.
5. Reviews the staffing shortage detail (which posts are open, which role is critical).
6. Assigns an available, qualified staff member to the critical role.
7. Returns to the dashboard.
8. Readiness updates **87% → 91%**, and the resolved alert clears from the attention list.
9. The new state survives a page refresh.

If a reviewer can do exactly this without a dead end, the MVP's core is working.

---

## 3. Core product principle — severity over averages

> **Operational statuses prioritize severity over averages. A high overall readiness percentage cannot mask a critical blocker.**

This is the heart of the product and must be visible in the design, not just the data.

Worked example (from the brief): tonight needs 120 event staff. 118 of 120 are confirmed = 98.3%. By percentage alone this looks **Ready**. But one of the two missing people is the required **VIP Security Lead** — a *critical* role. Because a critical requirement is unmet, the Staffing category is **Action Required**, not Ready. The percentage did not get a vote.

Two consequences the build must honor:
1. **Category status is gated by critical requirements**, computed from severity rules (§7), not from a completion percentage.
2. **The Issues Requiring Attention panel is always prominent** regardless of how high the overall readiness number is. A 95% readiness with one Action Required item still shows that item front and center.

---

## 4. Scope summary

### 4.1 In scope (MVP)
- Mock login screen and app shell.
- Single event dashboard: readiness hero, issues panel, eight-category operational grid.
- Drill-down detail view for **all eight** categories.
- Resolution flows for **all three** seeded alerts, each of which recomputes readiness.
- Deterministic readiness engine (§6) producing the 87 → 91 behavior.
- `localStorage` persistence of the full event state, plus a "Reset scenario" control.

### 4.2 Out of scope
See §1.5.

---

## 5. Information architecture & navigation

Single-page app with client-side routing.

```
/login                 Mock sign-in
/dashboard             Command center (default after login)
/category/:categoryId  Detail view for one of the 8 operational categories
```

- Alerts in the issues panel deep-link to the relevant category detail (`/category/staffing`, etc.), optionally with a query param or state flag that auto-opens the resolution UI.
- Resolution UIs are modals/sheets layered over the category detail, not separate routes, so "resolve → return to dashboard" is one action.
- A persistent top app bar shows event identity, countdown to doors, and last-updated timestamp on every authenticated screen.

Recommended libraries: React Router for routing; the resolution flows use shadcn `Dialog` or `Sheet`.

---

## 6. Readiness engine (deterministic model)

The readiness number and all category statuses are computed from seed data by a pure function, so behavior is reproducible and testable.

### 6.1 Overall readiness
```
overallReadiness = round( Σ (category.weight × category.readiness) )
```
where each `category.readiness` is a 0–100 number and weights sum to 1.0.

### 6.2 Canonical weights and seed values
These seeds are tuned to produce the exact reviewer numbers. Implement the mock data with these values.

| Category | Weight | Seed readiness | Seed status |
|---|---|---|---|
| Staffing | 0.16 | 60 | Action Required |
| Security | 0.15 | 98 | Ready |
| Ticketing / Entry | 0.14 | 90 | Watch |
| VIP | 0.12 | 95 | Ready |
| Venue / Facilities | 0.12 | 100 | Ready |
| Concessions | 0.11 | 96 | Ready |
| Parking | 0.10 | 94 | Ready |
| Merchandise | 0.10 | 70 | Watch |
| **Total** | **1.00** | | |

Weighted sum = **87.26 → 87%**.

### 6.3 Resolution deltas (must reproduce these outcomes)
| Resolution | Category change | New category status | Overall effect |
|---|---|---|---|
| Assign VIP Security Lead (golden path) | Staffing 60 → 85 | Watch | 87 → **91** |
| Resolve merchandise delivery | Merchandise 70 → 95 | Ready | +≈2 to +3 |
| Restore Section 114 scanner | Ticketing 90 → 98 | Ready | +≈1 |

Resolving all three brings overall readiness to ≈ **95%** (not 100 — other categories aren't perfect, which is realistic and reinforces that the number is honest).

### 6.4 Recompute rules
- Readiness recomputes synchronously on every resolution and any state mutation.
- `overallReadiness` is always derived, never stored as a source of truth (store category readiness/status; compute the total).
- Persist the derived value alongside for display convenience if desired, but recompute on load.

---

## 7. Status model & business logic

### 7.1 The three states
| Status | Meaning | Trigger |
|---|---|---|
| **Ready** (green) | No action needed | All critical requirements met and metrics within Ready thresholds |
| **Watch** (amber) | Could become a problem | All critical requirements met, but a non-critical requirement is incomplete or a metric is in the Watch band |
| **Action Required** (red) | Manager must intervene | Any critical requirement unmet |

Rule of precedence: **any single unmet critical requirement forces Action Required**, regardless of how many other requirements pass. This is the mechanical expression of §3.

### 7.2 Per-category status rules
Each category owns a set of requirements; each requirement is flagged `critical` or not. Status is derived by evaluating requirements against these rules.

| Category | Ready when… | Watch when… | Action Required when… |
|---|---|---|---|
| **Staffing** | ≥98% required positions confirmed AND all critical roles covered | 90–97% confirmed, critical roles covered | <90% staffed OR any critical role uncovered |
| **Security** | All required posts staffed AND checks complete | Minor post shortage or incomplete check | Critical security post uncovered |
| **Ticketing / Entry** | ≥98% scanners online AND entrances prepped | 95–97% scanners online or minor entry issue | <95% scanners online or entrance blocked |
| **Concessions** | ≥85% stands staffed AND inventory received | Staffing/inventory slightly below target | Major staffing shortage or critical inventory gap |
| **Parking** | Required lots open AND staffed | Reduced capacity or minor issue | Required lot unavailable or unstaffed |
| **VIP** | All VIP spaces prepped AND credentials ready | Non-critical setup task outstanding | Critical staffing/setup/credential failure |
| **Merchandise** | Inventory received AND stands set | Delivery delayed but still expected before doors | Delivery threatens opening or stands can't set |
| **Venue / Facilities** | Required inspections complete | Non-critical maintenance issue | Safety inspection failed or critical facility issue |

### 7.3 Seed requirements for the three active issues
The three alerts must map to specific unmet requirements so the detail views have real content.

- **Staffing → VIP entrance understaffed.** VIP entrance has 9 posts; 6 confirmed. Among the 3 unconfirmed, one is the **VIP Security Lead (critical)**. This unmet critical requirement drives Staffing to Action Required. (Overall staffing is 118/120 confirmed; the critical gap, not the count, is what matters.)
- **Merchandise → tour merchandise delivery delayed.** ETA moved 2:00 PM → 4:15 PM. Non-critical (still expected before doors) → Watch. Impacts East Concourse stand setup.
- **Ticketing → Section 114 scanner offline.** Device last heartbeat 11 minutes ago, scanner uptime 98%. Below the 98% Ready threshold but not a hard entry block → Watch.

---

## 8. Functional requirements

Numbered for traceability (Copilot can reference `FR-x`).

### 8.1 Authentication (mock)
- **FR-1** A `/login` screen with email + password fields and a submit button; also a one-click "Sign in as Venue Operations Manager" shortcut.
- **FR-2** Any non-empty credentials succeed (no validation against a backend). On success, set an `isAuthenticated` flag in the store and route to `/dashboard`.
- **FR-3** Unauthenticated access to any authenticated route redirects to `/login`.
- **FR-4** A sign-out control clears the auth flag and returns to `/login`. Sign-out does **not** reset scenario data.

### 8.2 Event context / app shell
- **FR-5** Top app bar on every authenticated screen shows: event name ("The Nova Tour"), date, doors time (6:30 PM), show time (8:00 PM), a live countdown to doors, expected attendance (18,742), and a "last updated" timestamp.
- **FR-6** The countdown ticks down from a fixed doors time; no behavior depends on it reaching zero (it may simply display).

### 8.3 Dashboard — readiness hero
- **FR-7** Display the overall readiness percentage prominently with the framing question "Are we ready for tonight?"
- **FR-8** Show a breakdown of how many categories are Ready / Watch / Action Required.
- **FR-9** When readiness changes after a resolution, the number visibly transitions (animated count or clear before/after) so the cause-and-effect is legible.

### 8.4 Dashboard — Issues Requiring Attention
- **FR-10** List all *unresolved* alerts, sorted by severity (Action Required before Watch), then by time sensitivity.
- **FR-11** Each alert row shows: severity indicator (color + icon + label, never color alone), title, a one-line detail, and time context (e.g., "Doors in 4h 22m").
- **FR-12** Each alert has a primary action ("View" / "Resolve") that routes to the relevant category detail with the resolution UI ready to open.
- **FR-13** The panel remains visible and prominent regardless of overall readiness value (§3). When zero alerts remain, show an explicit "All clear — no issues require attention" state.

### 8.5 Dashboard — operational metrics grid
- **FR-14** Render all eight categories as cards/rows, each showing category name, status chip (color + icon + label), one-line summary metric, and last-updated time.
- **FR-15** Each category is clickable and routes to its detail view (`/category/:id`).
- **FR-16** Status chips use the shared status system (§10.3) consistently everywhere in the app.

### 8.6 Category detail (all 8)
- **FR-17** For any category, show its current status, the readiness contribution, and its full requirements list with each requirement's current vs target value and satisfied/unsatisfied state; critical requirements are visually distinguished.
- **FR-18** Show the status logic for that category (the Ready/Watch/Action rule) so the manager understands *why* it's in its current state.
- **FR-19** If the category has an active alert, surface it here with the resolution CTA. Categories without alerts (the five healthy ones) still render a complete, populated detail view.
- **FR-20** A "Back to dashboard" affordance returns to `/dashboard`.

### 8.7 Resolution flow — VIP staffing (golden path)
- **FR-21** The staffing detail lists the 9 VIP-entrance posts with confirmed/unconfirmed status and flags the VIP Security Lead as critical.
- **FR-22** Present a roster of available staff members (mock) with names, qualifications, and current status/zone. Only staff qualified for the critical role can be assigned to it.
- **FR-23** Selecting a qualified staff member and confirming assigns them to the VIP Security Lead post: mark the post filled, mark that staff member assigned, clear the critical gap.
- **FR-24** On assignment, recompute Staffing (Action Required → Watch, readiness 60 → 85), recompute overall readiness (→ 91), remove the alert from the attention list, and show a confirmation toast (e.g., "VIP Security Lead assigned — Staffing updated").
- **FR-25** If no qualified staff are available, disable assignment for the critical role and show an explanatory empty state (edge case, §12).

### 8.8 Resolution flow — merchandise delivery
- **FR-26** The merchandise detail shows the delayed item, original vs revised ETA, affected stands (East Concourse), and impact.
- **FR-27** Provide a resolving action (e.g., "Confirm revised setup plan" / "Mark delivery received"). On action: Merchandise Watch → Ready (70 → 95), recompute overall readiness, clear the alert, confirmation toast.

### 8.9 Resolution flow — scanner offline
- **FR-28** The ticketing detail shows the offline device (Section 114), last heartbeat, uptime, and backup options.
- **FR-29** Provide a resolving action (e.g., "Deploy backup scanner" / "Mark device back online"). On action: Ticketing Watch → Ready (90 → 98), recompute overall readiness, clear the alert, confirmation toast.

### 8.10 Persistence & reset
- **FR-30** Persist the full event state (categories, requirements, alerts, staff roster, auth flag) to `localStorage` on every mutation; hydrate from it on load.
- **FR-31** All resolutions survive a page refresh (part of the reviewer test).
- **FR-32** Provide a "Reset scenario" control that restores the seed state (87%, three alerts) without requiring re-login. Confirm before resetting.
- **FR-33** Version the persisted schema (`schemaVersion`) so a stale/incompatible payload falls back to seed rather than breaking.

---

## 9. Data model (mock)

TypeScript-shaped sketch; the implementer may refine field names.

```ts
type Status = "ready" | "watch" | "action";

interface EventInfo {
  id: string;
  name: string;            // "The Nova Tour"
  venue: string;
  capacity: number;        // 20000
  date: string;            // ISO
  doorsAt: string;         // ISO — 18:30
  showAt: string;          // ISO — 20:00
  expectedAttendance: number; // 18742
}

interface Requirement {
  id: string;
  label: string;
  critical: boolean;
  satisfied: boolean;
  current?: string | number;
  target?: string | number;
}

interface Category {
  id: "staffing" | "security" | "ticketing" | "concessions"
     | "parking" | "vip" | "merchandise" | "facilities";
  name: string;
  weight: number;          // sums to 1.0 across categories
  readiness: number;       // 0–100
  status: Status;          // derived from requirements, cached for display
  summary: string;         // one-line dashboard metric
  requirements: Requirement[];
  statusRule: string;      // human-readable rule text for the detail view
  lastUpdated: string;     // ISO
}

interface Alert {
  id: string;
  categoryId: Category["id"];
  severity: Status;        // "action" | "watch"
  title: string;           // "VIP entrance understaffed"
  detail: string;          // "6 of 9 positions confirmed"
  impact?: string;
  timeContext?: string;    // "Doors in 4h 22m"
  resolutionType: "assignStaff" | "confirmDelivery" | "restoreDevice";
  resolved: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  qualifications: string[]; // e.g. ["vip_security_lead", "usher"]
  status: "available" | "assigned" | "on_break";
  zone?: string;
}

interface AppState {
  schemaVersion: number;
  isAuthenticated: boolean;
  event: EventInfo;
  categories: Category[];
  alerts: Alert[];
  staff: StaffMember[];
  overallReadiness: number; // derived
}
```

Seed the roster with at least one `available` member qualified for `vip_security_lead` (so the golden path succeeds) plus a few unqualified/on-break members (so the qualification filter is meaningful).

---

## 10. UX & visual design

### 10.1 Aesthetic direction
Dark command-center, matching the brief's mockups: near-black/charcoal surfaces, high-contrast text, saturated status accents. Dense but scannable — this is a professional's monitoring tool, not a marketing page. Desktop-first, optimized for a large single screen; degrade gracefully to laptop widths.

### 10.2 Layout
- Fixed top app bar (event identity + countdown + last-updated + sign-out).
- Dashboard: readiness hero band across the top; two primary regions below — Issues Requiring Attention (given visual priority) and the eight-category grid.
- Category detail: header with status, requirements table, status-rule explainer, and (if present) the alert + resolution CTA.

### 10.3 Status system (shared, used everywhere)
| Status | Color role | Icon | Label |
|---|---|---|---|
| Ready | green/success | check-circle | Ready |
| Watch | amber/warning | alert-triangle | Watch |
| Action Required | red/destructive | alert-octagon | Action Required |

Status is **never** conveyed by color alone — always color + icon + text label (accessibility, §11).

### 10.4 Suggested shadcn/ui components
`Card`, `Badge` (status chips), `Button`, `Dialog` / `Sheet` (resolution flows), `Table` (requirements, staff roster), `Tabs` (optional within detail), `Progress` or a custom radial for the readiness hero, `Avatar` (staff), `Sonner`/`Toast` (confirmations), `Separator`, `ScrollArea`. Use `lucide-react` for icons.

### 10.5 Motion
Keep it purposeful: animate the readiness number on change (count-up or clear before→after), and give resolved alerts a brief exit transition so the manager sees them leave the list. Avoid decorative animation elsewhere.

---

## 11. Accessibility
- Status meaning available without color (icon + label), per §10.3.
- Full keyboard operability: all alerts, category cards, and resolution controls are reachable and actionable via keyboard; visible focus states throughout.
- Dialogs/sheets trap focus, are dismissible via Escape, and are labeled (`aria-labelledby`/`aria-describedby`).
- Readiness changes and resolution confirmations announced via an `aria-live` region.
- Meet WCAG AA contrast on the dark theme (verify status colors against dark surfaces).

---

## 12. Edge cases & error states
- **No qualified staff available** for the critical role → disable assignment, show "No qualified staff available — escalate" empty state (FR-25).
- **Refresh mid-flow** → hydrated state reflects only committed resolutions; an open, unconfirmed resolution dialog does not persist.
- **Already-resolved alert** → its category detail shows the resolved/healthy state; the alert is absent from the attention list; no way to "double-resolve."
- **All alerts resolved** → attention panel shows the all-clear state; readiness sits at ≈95%.
- **Corrupt/stale `localStorage`** (schema mismatch) → fall back to seed data (FR-33).
- **Reset scenario** → returns exactly to the 87% / three-alert seed, including the staff roster.

---

## 13. Tech stack & architecture

| Concern | Recommendation |
|---|---|
| Framework | React 18 + TypeScript, Vite |
| UI | shadcn/ui + Tailwind CSS, lucide-react icons |
| Routing | React Router |
| State | Zustand with `persist` middleware (localStorage). Alternative: Context + `useReducer` + a small persistence effect |
| Readiness logic | Pure functions in a dedicated module (`lib/readiness.ts`), unit-testable |
| Mock data | Static seed module (`data/seed.ts`) consumed by the store on first load |

Architectural principles: keep the readiness computation pure and separate from React; store category readiness/status as source-of-truth and derive the overall number; keep resolution handlers small (mutate the relevant requirement/category, then trigger recompute).

Suggested structure:
```
src/
  app/            routes, layout, auth guard
  components/     dashboard, category-detail, resolution flows, shared status chip
  data/seed.ts    canonical seed (weights + seeds from §6.2, §7.3)
  lib/readiness.ts  pure recompute + status-derivation functions
  store/          Zustand store + persist config
  types.ts        model from §9
```

---

## 14. Build plan (phased, for the Copilot agent)

Each phase is independently runnable so you can review as you go.

- **Phase 0 — Scaffold.** Vite + React + TS, Tailwind, shadcn init, dark theme tokens, folder structure, routing skeleton with an auth guard.
- **Phase 1 — Data + engine.** Types (§9), seed data (§6.2 / §7.3), Zustand store with localStorage persist, `readiness.ts` pure functions. Verify the seed computes to 87 and the golden-path delta computes to 91 (a couple of unit tests here pay off).
- **Phase 2 — Auth + shell.** Login screen (FR-1–4), top app bar with countdown (FR-5–6).
- **Phase 3 — Dashboard.** Readiness hero (FR-7–9), issues panel (FR-10–13), eight-category grid (FR-14–16), all reading from the store.
- **Phase 4 — Category details.** Detail view for all eight categories (FR-17–20), including the five healthy ones.
- **Phase 5 — Golden path.** VIP staffing resolution end-to-end (FR-21–25); confirm the reviewer test (§2) passes including refresh persistence.
- **Phase 6 — Remaining resolutions.** Merchandise (FR-26–27) and scanner (FR-28–29) flows.
- **Phase 7 — Polish.** Readiness animation, toasts, all-clear state, reset scenario (FR-32), edge/empty states (§12), accessibility pass (§11).

---

## 15. Acceptance criteria (MVP done when…)
1. The reviewer test in §2 passes without a dead end, including the 87 → 91 change and refresh persistence.
2. All three alerts are independently resolvable; resolving all three yields ≈95% readiness and an all-clear attention panel.
3. All eight categories have a populated, correct detail view.
4. A category with an unmet critical requirement always shows Action Required regardless of its percentage (§3 verified with the staffing case).
5. State persists across refresh; "Reset scenario" restores the 87% seed.
6. Status is legible without relying on color; core flows are keyboard-operable.

---

## 16. Open questions
1. **Merchandise/scanner resolution semantics** — is a single "resolve" action enough, or do you want a small decision (e.g., choose backup scanner vs. dispatch tech) to give those flows more texture? Current spec assumes a single meaningful action each.
2. **Staffing after golden path** — spec lands Staffing on *Watch* (critical filled, two non-critical posts still open), not full Ready. Confirm that's the intended honesty, vs. jumping straight to Ready.
3. **Countdown behavior** — display-only is assumed; do you want it to influence anything (e.g., escalate a Watch to Action as doors approach)? Out of scope unless you want it.
4. **"All clear" celebratory state** — worth a distinct visual moment at ≈95% with zero alerts, or keep it understated?
