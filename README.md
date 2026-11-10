# Community Fundraising Monitor

**MIS 306F Team 10 · San Diego State University · Academic prototype for Wounded Warrior Project (WWP)**

> **Academic Prototype — Synthetic Data Only.** This application uses fictional data and is **not connected to WWP, Salesforce, or DonorDrive systems.** It does not send email, process donations, or modify any real record. It is not affiliated with or endorsed by WWP and uses no WWP branding.

---

## 1. Overview and academic purpose

Community fundraising staff need to find fundraising events that still show **$0 in posted donations more than 30 days after the event date**, figure out why, and follow up.

A $0 total does **not** mean funds are missing. Common explanations include check or bank processing delays, pending advisory-board activity, donations expected after the event, identity or attribution mismatches, gifts made on another WWP page, and money collected through third-party apps such as Venmo, Zelle, or Cash App. Sometimes there was simply no fundraising.

The dashboard therefore **flags events as "Needs Review" and never as "Missing Funds."** It supports human investigation: staff look into each case, prioritize it, assign it, write notes, schedule follow-up, and decide the outcome.

This is a proof of concept. It is not a CRM, a Salesforce replacement, or a production system.

## 2. Technology stack

| Concern | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build / dev server | Vite 6 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| State | React hooks (`useState`, `useMemo`) and a custom `useEventData` hook |
| Persistence | Browser `localStorage` |
| Tests | Vitest + Testing Library (jsdom) |
| Backend / DB / auth / APIs | **None** — static site only |

## 3. Prerequisites

- **Node.js 20 or newer** (tested with Node 24.14) and npm.
- Any modern browser (Chrome, Edge, Firefox, Safari).

## 4. Installation

```bash
cd WWP_Dashboard_PT
npm install
```

## 5. Local development

```bash
npm run dev
```

Open the URL Vite prints, normally <http://localhost:5173>.

## 6. Production build

```bash
npm run build      # type-checks, then writes static files to dist/
npm run preview    # serves dist/ locally at http://localhost:4173
```

The build has no server code and no environment variables or secrets. `vite.config.ts` sets `base: './'`, so asset paths are relative and the same `dist/` folder works at a domain root or under a sub-path.

## 7. Static hosting / deployment

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output (publish) directory | `dist` |
| Node version | 20+ |

**Netlify:** Use *Add new site → Import an existing project*, pick the repository, and enter the settings above. You can also run `npm run build` and drag the `dist/` folder onto <https://app.netlify.com/drop>.

**Vercel:** Use *Add New → Project*, import the repository, and choose the **Vite** framework preset. It fills in `npm run build` and `dist` for you.

**GitHub Pages:**
1. Push the project to a GitHub repository.
2. Run `npm run build`.
3. Publish `dist/`. Two ways to do that:
   - Use the `gh-pages` package: `npx gh-pages -d dist`, then set *Settings → Pages → Branch* to `gh-pages`.
   - Use a GitHub Actions workflow that runs `npm ci && npm run build` and uploads `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages`.

The app has a single page and no client-side routes, so no redirect or rewrite rules are needed. Hosting does not require a domain purchase, a paid service, or a WWP account.

> No live URL has been published yet. Deploy using one of the options above.

## 8. Synthetic dataset

Every event, host, specialist, note, amount, and identifier is **fictional**. IDs use the prototype format `CFM-1001` and are not Salesforce or DonorDrive IDs. The data contains no emails, phone numbers, donor records, or real page IDs, and a unit test checks this.

All dates are calculated **relative to a fixed demo as-of date of 2026-11-10**, so the boundary cases always give the same results.

| ID | Scenario | Expected result (as of 2026-11-10) |
|---|---|---|
| CFM-1001 | **Case 1**: 29 days, $0 | Not flagged (within 30 days) |
| CFM-1002 | **Case 2**: exactly 30 days, $0 | Not flagged |
| CFM-1003 | **Case 3**: 31 days, $0 | **Flagged** |
| CFM-1004 | **Case 4**: 60 days, $0, check in transit | **Flagged**; review status *Awaiting Bank or Check Processing* and processing status kept |
| CFM-1005 | **Case 5**: 45 days, $0, post-event donations expected | **Flagged**; delay reason visible |
| CFM-1006 | **Case 6**: 45 days, $1,240 posted | Not flagged (donations posted) |
| CFM-1007 | **Case 7**: event 14 days in the future | Not flagged (upcoming) |
| CFM-1008 | **Case 8**: missing event date | **Data-quality exception**, not in the flagged queue |
| CFM-1009 | **Case 9**: 75 days, $0, attribution mismatch | **Flagged**; mismatch status and reason visible |
| CFM-1010 | **Case 10**: resolved, $0 (funds found on another page) | Not in the active queue |
| CFM-1011 | Extra: closed, $0, event cancelled | Not in the active queue |
| CFM-1012 – CFM-1018 | Extra records with a mix of statuses, priorities, specialists, overdue follow-ups, and posted donations | Make filtering and sorting meaningful |

Default results: **10 flagged events, 4 High priority, 2 awaiting processing, average age 53.1 days.**

### File locations

| What | Where |
|---|---|
| **Mock event data** | [`src/data/mockEvents.ts`](src/data/mockEvents.ts) (`createSeedEvents()`, `DEMO_AS_OF_DATE`) |
| Mock specialists | [`src/data/mockSpecialists.ts`](src/data/mockSpecialists.ts) |
| **Eligibility / flagging rules** | [`src/utils/eventRules.ts`](src/utils/eventRules.ts) |
| **Date handling** | [`src/utils/dateUtils.ts`](src/utils/dateUtils.ts) |
| KPI calculations | [`src/utils/dashboardMetrics.ts`](src/utils/dashboardMetrics.ts) |
| Filters, sorting, views | [`src/utils/eventFilters.ts`](src/utils/eventFilters.ts) |
| Demo actions (status, notes, …) | [`src/utils/eventActions.ts`](src/utils/eventActions.ts) |
| localStorage persistence | [`src/utils/demoStorage.ts`](src/utils/demoStorage.ts), [`src/hooks/useEventData.ts`](src/hooks/useEventData.ts) |
| Types and option lists | [`src/types/event.ts`](src/types/event.ts) |

None of the business rules live in React components, so they can be tested on their own.

## 9. Configurable as-of date

The **As-of date** control in the header sets the "today" used in every calculation. It starts at **November 10, 2026** and does not depend on the computer's clock, so a demo gives the same results on any day.

Changing the as-of date immediately recalculates days since each event, which events are flagged, the KPIs, the tab counts, filtered results, and overdue next-action dates. For example, moving it forward one day pulls the exactly-30-day event (CFM-1002) into the queue. **Use demo date** goes back to 2026-11-10.

Notes, status changes, and other demo actions are **dated with the as-of date**, which acts as the simulated working day, so the timeline stays consistent with the scenario.

### Date handling

Dates are stored as ISO date-only strings (`YYYY-MM-DD`). They are converted to whole-day numbers with `Date.UTC` and formatted in UTC. Local time zones and daylight-saving changes cannot cause off-by-one errors, and the tests run in `America/Los_Angeles` to prove it.

## 10. 30-day monitoring logic

```text
isFlagged =
  hasValidEventDate
  AND daysSinceEvent > 30        (strictly greater; 30 is NOT flagged)
  AND amountRaised === 0         (exactly zero)
  AND NOT isResolved             (reviewStatus === "Resolved or Funds Attributed")
  AND NOT isClosed
```

- An event with a **missing or invalid date** is never flagged. If it is open and unresolved, it appears under **Data-Quality Exceptions**.
- The **calculated flag is kept separate from the staff-managed review status.** An event marked *Awaiting Bank or Check Processing* (or any other unresolved status) **stays in the active queue**. Only *Resolved or Funds Attributed* or **Close Record** removes it.
- The **Min. days since event** filter only narrows the list on screen. It never changes the 30-day rule. Setting it to 0 does not add 29- or 30-day events to the queue.
- In **All Events**, a *Monitoring Result* column explains each record: Flagged, Within 30 Days (which includes exactly 30), Upcoming, Donations Posted, Resolved, Closed, or Data-Quality Review.

## 11. Review statuses, priorities, and demo actions

**Review statuses:** Needs Review · Awaiting Bank or Check Processing · Awaiting Advisory Board · Post-Event Donations Expected · Host Contact Needed · Data or Attribution Mismatch · Confirmed No Activity · Resolved or Funds Attributed.

**Review reason** and **processing status** are separate fields. Their option lists are *demonstration taxonomies* chosen by Team 10 and are **not official WWP classifications**.

**Priority** (High > Medium > Low) is a staff-assigned, illustrative value set in the mock data. It is **not** an official WWP risk model, and older events are not automatically High.

To act on an event, select its name in the table. A detail drawer opens. Close it with ✕, Esc, or by clicking the backdrop. The drawer offers these actions:

| Action | Effect |
|---|---|
| Change review status / reason / processing status / priority | Edit in the form, then **Save changes**. Each changed field adds a timeline entry. |
| Assign specialist | Choose a fictional specialist or *Unassigned*, then save. |
| Set next action date | Pick a date, then save. Past dates show as **Overdue** in the table. |
| Add follow-up note | Type a note and select **Add note**. It appears in Notes and in the timeline. |
| **Mark Awaiting Processing** | Sets the review status to *Awaiting Bank or Check Processing*. The event **stays** in the queue. |
| **Mark Resolved** / Reopen Case | Resolved events leave the active queue but stay visible in **All Events**. |
| Close Record / Reopen Record | Administrative closure, which also removes the event from the queue. |

Every action shows a confirmation toast, updates the KPIs and the table right away, and is labeled **Demo action** in the timeline. Seed timelines contain only activities supported by the synthetic record. No action sends a message or processes a transaction.

## 12. localStorage and resetting the demo

- All edits, including the as-of date, are saved under the browser key `cfm-demo-state-v1` and survive a page refresh.
- Data stays in **that browser only**. Other viewers and devices see the original dataset.
- **Reset Demo Data** in the header opens a confirmation dialog. Confirming restores the original synthetic dataset, the demo as-of date, and the default filters, sort, and view.
- If storage is unavailable (for example, some private-browsing modes), the app still works in memory.

## 13. Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run typecheck     # TypeScript only
```

There are 61 automated tests in three files.

- **`src/utils/eventRules.test.ts`** covers business rules and seed data:
  - excludes 29 days; excludes exactly 30 days; includes 31 days
  - exactly-$0 eligibility; excludes positive amounts; excludes future dates
  - routes missing or invalid dates to data quality; excludes resolved and closed events
  - unresolved processing statuses stay flagged
  - recalculates after the as-of date changes; day math across daylight-saving changes
  - every one of the ten required scenarios, timeline date consistency, and a check that the data contains no contact details
- **`src/utils/dashboard.test.ts`** covers KPIs (including the empty set, as-of changes, and resolution), every filter alone and combined, the rule that min-days never overrides the 30-day rule, views, all sort keys with missing dates sorted last, and each demo action.
- **`src/App.test.tsx`** covers component and interaction behavior:
  - disclaimer, the ten table columns, and default KPIs
  - filtering, the empty state, and clearing filters; sorting with `aria-sort`
  - opening and closing the drawer
  - changing status, assigning a specialist, setting a next-action date, and adding a note
  - awaiting-processing vs. resolve behavior and the KPI updates
  - the data-quality tab and as-of date recalculation
  - **persistence across a remount (simulated refresh)** and **reset with confirm or cancel**

## 14. Relationship to the process model

| Process | How the prototype supports it |
|---|---|
| 1.0 Register and Onboard Host | Shown through synthetic registration data: host, event type, goal, and registration entries in the timeline |
| 2.0 Maintain Fundraiser Data | Shown through record fields (event date, source system, last updated) and the **data-quality exception** view |
| **3.0 Monitor Fundraising Activity** | As-of date, the 30-day / $0 flagging rule, the active queue, and KPIs |
| **4.0 Investigate and Prioritize $0 Status** | Detail drawer, review status and reason, processing context, priority, specialist assignment, filters, and sorting |
| **5.0 Contact and Follow Up** | Follow-up notes, next-action dates and overdue highlighting, status tracking through resolution or closure, and the timeline |
| 6.0 Process and Attribute Donations | Shown through processing status, posted amounts, and "Resolved or Funds Attributed" outcomes |

The dashboard is **one component** of the proposed end-to-end process, not the whole solution. Automated email to hosts is a possible future component and is **not** included.

## 15. Requirements-to-feature mapping

| Requirement | Feature / location |
|---|---|
| Disclaimer visible in app | Amber banner under the header (`AppHeader.tsx`) and footer |
| Configurable as-of date | Header date input → `useEventData.setAsOfDate` |
| Flagging rule and boundaries | `eventRules.ts → isFlagged`, `getMonitoringResult` |
| KPI cards (4) | `KpiCards.tsx`, `dashboardMetrics.ts` |
| Filters (7 required + search) | `FilterPanel.tsx`, `eventFilters.ts → applyFilters` |
| Sorting (date, days, priority, name) | Sortable column headers, `sortEvents` |
| Main table (10 columns) | `EventsTable.tsx` |
| Views for non-flagged and data-quality records | Tabs: Active Flagged Queue / Data-Quality Exceptions / All Events |
| Empty states | `EmptyState.tsx` (filtered, empty queue, no exceptions) |
| Detail drawer with all fields and timeline | `EventDrawer.tsx`, `Timeline.tsx` |
| Demo actions | `CaseManagement.tsx`, `eventActions.ts` |
| Persistence and reset with confirmation | `demoStorage.ts`, `ConfirmDialog.tsx` |
| Optional extras | Search, visible record count, overdue highlighting, KPI definitions (tooltips and screen-reader text), "How monitoring works" panel |

## 16. Data dictionary

| Field | Type | Description |
|---|---|---|
| `id` | string | Fictional prototype ID (`CFM-####`) |
| `eventName` | string | Fundraising event name |
| `hostName` | string | Fundraiser registrant / host (fictional) |
| `eventDate` | ISO date \| null | Event date; null means a data-quality exception |
| `eventType` | union | e.g. Golf Tournament, 5K Run/Walk, Gala/Dinner |
| `amountRaised` | number (USD) | Posted fundraising amount |
| `fundraisingGoal` | number \| null | Optional target |
| `reviewStatus` | union (8) | Staff-managed operational status; *Resolved or Funds Attributed* means resolved |
| `reviewReason` | union | Why the event is under review or delayed (demo taxonomy) |
| `priority` | High \| Medium \| Low | Staff-assigned, illustrative |
| `assignedSpecialist` | string \| null | Fictional specialist |
| `lastReviewed` | ISO date \| null | Last review action |
| `nextActionDate` | ISO date \| null | Scheduled follow-up |
| `processingStatus` | union | Donation processing context (demo taxonomy) |
| `lastUpdated` | ISO date | Last change to the record |
| `sourceSystem` | "Simulated NPSP" \| "Simulated DonorDrive" | Label only, with no connection to either system |
| `notes` | FollowUpNote[] | `{ id, date, author, text }` |
| `timeline` | TimelineEntry[] | `{ id, date, type, description, actor, isDemoAction? }` |
| `isClosed` | boolean | Administratively closed |

**Derived (never stored):** `daysSinceEvent`, `isFlagged`, `isDataQualityException`, monitoring result, overdue next action.

## 17. Future Salesforce integration (not implemented)

The UI depends only on the `FundraisingEvent[]` returned by `useEventData`. A future version could keep every rule, component, and test and replace the data source:

1. Add a small backend or integration service that queries Salesforce NPSP and DonorDrive with proper authentication. Credentials would live on the server, never in the browser.
2. Map those records to the `FundraisingEvent` type in one adapter function.
3. Replace `loadDemoState()` / `saveDemoState()` with API calls, so status, notes, and assignments are written back to the system of record instead of `localStorage`.
4. Set the as-of date to "today" in production while keeping it configurable for audits and testing.

WWP would need to approve the data access, field mappings, the official status and reason taxonomies, and any prioritization model before this could happen.

## 18. Prototype limitations

- Fictional data only. There is no real integration, authentication, user roles, or multi-user sync.
- Edits are stored in one browser's `localStorage` and are not shared.
- Review reasons, processing statuses, and priorities are demonstration values, not approved WWP classifications.
- All notes and timeline entries are written by "Demo User" and dated with the as-of date.
- No automated messaging, email, exports, or donation processing.
- The table scrolls horizontally on narrow screens. The layout is desktop-first and responsive, not a native mobile experience.

## Project structure

```text
src/
  components/
    layout/      AppHeader
    dashboard/   KpiCards, ProcessInfo
    filters/     FilterPanel
    events/      ViewTabs, EventsTable, EventDrawer, CaseManagement, Timeline
    shared/      Badges, EmptyState, ConfirmDialog, Toast, buttonStyles
  data/          mockEvents.ts, mockSpecialists.ts
  hooks/         useEventData.ts
  types/         event.ts
  utils/         eventRules.ts, dateUtils.ts, dashboardMetrics.ts, eventFilters.ts,
                 eventActions.ts, demoStorage.ts, format.ts  (+ *.test.ts)
  App.tsx, App.test.tsx, main.tsx, index.css
```
