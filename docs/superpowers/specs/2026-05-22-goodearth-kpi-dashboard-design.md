# GoodEarth KPI Dashboard — Design Spec

**Date:** 2026-05-22  
**Author:** Prashanth Palanisamy  
**Status:** Draft

---

## Multi-Agent Development Setup

This project is built by a team of AI agents coordinated through a shared handoff file (`AGENTS.md`) in the repo root.

| Agent | Role |
|-------|------|
| Claude | Primary orchestrator — owns the plan, assigns tasks, resolves conflicts |
| Gemini | Builder — implements features based on tasks in `AGENTS.md` |
| Codex | Code reviewer — reviews PRs/diffs, flags issues back into `AGENTS.md` |

### Handoff Protocol

`AGENTS.md` in the repo root is the single source of truth for agent coordination:

```
AGENTS.md
├── Current phase and sprint goal
├── TODO list (pending / in-progress / done)
├── Last action (which agent did what, when)
├── Next action (which agent should pick up, and what)
└── Open questions / blockers
```

Each agent reads `AGENTS.md` at the start of its session, does its work, then updates `AGENTS.md` before handing off. Claude updates the orchestration sections; Gemini updates task status as it builds; Codex adds review notes inline.

A `TASKS.md` file tracks the granular task list separately so `AGENTS.md` stays readable at a glance.

### Git Workflow

Git is kept clean — one meaningful commit per completed task, not per agent action.

```
1. Gemini: git pull origin main          ← start with latest
2. Gemini: builds / makes changes locally
3. Gemini → Codex: share diff for review (no commit yet)
4. Codex: reviews, flags issues back to Gemini
5. Gemini: fixes issues locally
6. Gemini: git commit + git push          ← ONE commit when work is clean
7. Gemini: updates AGENTS.md + TASKS.md, pushes
```

**Rules:**
- Gemini is the sole committer — all code changes go through Gemini's push
- Claude orchestrates via `AGENTS.md` (reads/writes it) but does not commit code
- Codex reviews locally (reads the diff) and reports back — never commits directly
- Commit messages describe the completed task: `"add /api/data endpoint with CSV parsing"` — not agent names or process steps
- Never force-push to main
- If a pull conflict is found, Gemini stops and flags it in `AGENTS.md` for Claude to resolve before any work proceeds

**Repository:** `github.com/prashanth-palanisamy/ge-kpi` (to be created)

---

## Context

GoodEarth manages multiple project types — internal developments (Motif, Octave, Ochre, Cadence), external client projects (restoration, interiors), and initiator ventures (Interiors, Home Automation, Furniture). There is no single place for leadership to see the health of all these streams at a glance.

This dashboard solves that: a single hosted page where leadership can see live KPIs across all domains, with a clear path to add more data sources and eventually replace Google Sheets with in-app data entry.

---

## Goals

- Give leadership a single URL with live project health across all domains
- Pull financial data live from the existing Project Accounts Google Sheet
- Show other sections (External Projects, Initiators, Sales & Marketing) as placeholders — to be wired up as data becomes available
- Build the architecture so that: (a) data sources can be swapped without rebuilding the UI, (b) monthly snapshots can be stored over time for trend analysis, (c) a coordinator data-entry UI can be added in a later phase

---

## Phased Roadmap

### Phase 1 (now): Live dashboard from Google Sheets
- Node.js + Express app on Railway
- Server fetches Google Sheets CSV, maps to a clean internal data schema, exposes `/api/data`
- Frontend renders financial KPIs for Internal Projects (live), all other sections greyed out
- PostgreSQL provisioned but dormant

### Phase 2 (next): Monthly snapshots + trends + project management
- Server saves a snapshot of `/api/data` response to PostgreSQL on the 1st of each month
- Dashboard gains a trend line chart showing month-on-month changes per project
- **Project CRUD**: coordinator can add new projects, edit project metadata, or mark projects as archived/inactive — no code change required
- Projects stored in PostgreSQL; the hardcoded list from Phase 1 migrates to DB rows
- No frontend data entry for KPI values yet — still pulling from Sheets

### Phase 3 (later): In-app data entry
- Coordinator login (simple auth)
- Form-based data entry replaces Google Sheets as the data source
- Sheets can still be used as an import path if preferred
- Sales, Construction, External Projects, Initiators sections become live

---

## Architecture

```
Railway
├── Node.js / Express
│   ├── GET /              → serves index.html
│   ├── GET /api/data      → fetches Google Sheets CSV, returns clean JSON
│   └── (Phase 2) POST /api/snapshot → saves monthly snapshot to PostgreSQL
└── PostgreSQL
    └── (Phase 2) snapshots table: { project, month, metrics_json, created_at }
```

**Data flow (Phase 1):**
1. Browser loads `index.html` from Railway
2. `index.html` calls `GET /api/data`
3. Express fetches the published Google Sheets CSV
4. Server parses CSV → maps to internal schema (see below)
5. Returns JSON → frontend renders charts and cards

**Why server-side fetch (not direct CSV in browser):**  
- No CORS issues  
- Sheet URL stays private  
- Easy to swap data source in Phase 3 without touching frontend

---

## Internal Data Schema

The frontend only ever sees this shape — regardless of whether the source is Google Sheets, a form, or a database:

```json
{
  "lastUpdated": "2026-05-22",
  "internalProjects": [
    {
      "name": "Motif",
      "status": "green",
      "financial": {
        "building": { "spent": 39.77, "balance": 1.43, "budgetPerSft": 2757, "projectedPerSft": 2459, "impactPerSft": -344, "impactCr": -6.25 },
        "infra":    { "spent": 21.55, "balance": 0.51, "budgetPerSft": 1442, "projectedPerSft": 1372, "impactPerSft": -92,  "impactCr": -1.67 }
      },
      "construction": null,
      "sections": ["financial"]
    }
  ],
  "externalProjects": [],
  "initiators": [],
  "salesMarketing": null
}
```

`status` RAG logic:
- `green` — projected per sft < budget per sft (under budget)
- `amber` — projected per sft within 5% over budget
- `red` — projected per sft > 5% over budget

---

## Frontend Design

**Visual style:** Warm cream editorial  
- Background: `#faf8f3`  
- Accent: `#8b6914` (gold/terracotta)  
- Cards: white with `#e8dcc8` border  
- Fonts: system serif for headings, sans-serif for data  

**Page structure (single scroll):**

1. **Header strip** — "GoodEarth KPI Dashboard" + last updated date
2. **Internal Projects** (LIVE)
   - 4 project health cards: name, RAG dot, total spent, budget utilisation %
   - Financial detail per project: Building and Infra progress bars (spent / total budget), cost per sft comparison
   - Bar chart: all 4 projects — budget vs projected per sft (Chart.js)
   - Construction sub-section: greyed out "Coming soon"
3. **External Projects** — full section greyed out with placeholder
4. **Initiators** — full section greyed out with placeholder
5. **Sales & Marketing** — full section greyed out with placeholder

**Greyed-out sections** are visually present (show the section heading and a descriptive placeholder card) so leadership can see the full intended scope of the dashboard.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Hosting | Railway | Built-in PostgreSQL, no migration when Phase 2 arrives |
| Backend | Node.js + Express | Minimal, well-known, easy to extend |
| Database | Railway PostgreSQL | Dormant in Phase 1, ready for snapshots in Phase 2 |
| Frontend | Vanilla HTML + CSS + JS | No build step, simple to update |
| Charts | Chart.js (CDN) | Lightweight, reliable bar/line charts |
| Data source | Google Sheets (published CSV) | Existing sheet, no new tooling needed |

---

## Files (Phase 1)

```
ge-kpi/
├── package.json
├── server.js              ← Express app: serves static files + /api/data endpoint
├── public/
│   └── index.html         ← Dashboard frontend
├── AGENTS.md              ← Agent handoff file (orchestration state, next action)
├── TASKS.md               ← Granular task list (pending / in-progress / done)
└── .env                   ← SHEETS_CSV_URL (not committed)
```

---

## Verification

1. `npm start` → server runs on localhost:3000
2. Open `localhost:3000` → dashboard loads with warm cream styling
3. Internal Projects section shows live data for Motif, Octave, Ochre, Cadence
4. Financial numbers match the Google Sheet exactly
5. RAG status dots are correct (green = under budget, amber/red = over)
6. External Projects, Initiators, Sales & Marketing sections are visible but greyed out
7. Deploy to Railway → same result at the Railway URL
8. Update a number in the Google Sheet → refresh dashboard → number updates
