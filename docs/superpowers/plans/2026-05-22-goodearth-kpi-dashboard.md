# GoodEarth KPI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page KPI dashboard for GoodEarth leadership, served by a Node.js/Express app on Railway, pulling live financial data from a published Google Sheet CSV.

**Architecture:** Express serves `public/index.html` and a `/api/data` endpoint that fetches + parses the Google Sheet CSV into a clean JSON schema. The frontend fetches `/api/data` on load and renders four project cards with Chart.js charts. PostgreSQL is provisioned but unused in Phase 1. All other sections (External Projects, Initiators, Sales & Marketing) are rendered as greyed-out placeholders.

**Tech Stack:** Node.js 20, Express 4, Jest (tests), Chart.js 4 (CDN), Railway (hosting + PostgreSQL), GitHub (version control)

---

## File Map

```
ge-kpi/
├── package.json                  ← deps: express, node-fetch, csv-parse; devDeps: jest
├── server.js                     ← Express app: GET / → public/index.html, GET /api/data
├── src/
│   └── parseSheet.js             ← pure function: CSV string → internal data schema
├── public/
│   └── index.html                ← dashboard: warm cream style, fetches /api/data, renders charts
├── tests/
│   └── parseSheet.test.js        ← unit tests for parseSheet
├── AGENTS.md                     ← agent handoff state (current phase, last action, next action)
├── TASKS.md                      ← granular task checklist (all tasks from this plan)
├── .env                          ← SHEETS_CSV_URL=<published csv url> (not committed)
├── .env.example                  ← SHEETS_CSV_URL=your_published_csv_url_here
└── .gitignore                    ← node_modules, .env
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialise the repo**

```bash
cd /Users/prashanthpalanisamy/Developer/ge-kpi
git init
```

Expected: `Initialized empty Git repository in .../ge-kpi/.git/`

- [ ] **Step 2: Create package.json**

```json
{
  "name": "ge-kpi",
  "version": "1.0.0",
  "description": "GoodEarth KPI Dashboard",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "jest"
  },
  "dependencies": {
    "csv-parse": "^5.5.3",
    "express": "^4.18.2",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.env
.superpowers/
```

- [ ] **Step 5: Create .env.example**

```
SHEETS_CSV_URL=your_published_google_sheets_csv_url_here
PORT=3000
```

- [ ] **Step 6: Create .env with the real URL**

```
SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_4f1jTZ3RY__MgbS2YrcGgxXYK-Q9UfM5IEqIy-Zsra6Lm4nKGBjfNPLqVnlZxREethc9lU86JIHS/pub?output=csv
PORT=3000
```

- [ ] **Step 7: Create GitHub repo and push**

```bash
gh repo create prashanth-palanisamy/ge-kpi --public --source=. --remote=origin
git add package.json package-lock.json .gitignore .env.example
git commit -m "scaffold: initialise project with Express and Jest"
git push -u origin main
```

---

## Task 2: Agent Coordination Files

**Files:**
- Create: `AGENTS.md`
- Create: `TASKS.md`

- [ ] **Step 1: Create AGENTS.md**

```markdown
# GoodEarth KPI — Agent Coordination

## Current Phase
Phase 1 — Build and deploy the live financial dashboard.

## Last Action
Claude (2026-05-22): Created spec and implementation plan. Project scaffolded and pushed to GitHub.

## Next Action
Gemini: Pick up Task 3 (parseSheet module). Pull latest main before starting.

## Open Questions / Blockers
None.

## Agent Roles
| Agent | Role |
|-------|------|
| Claude | Orchestrator — owns AGENTS.md, assigns tasks, resolves conflicts |
| Gemini | Builder — implements tasks, does ONE commit per completed task after Codex review |
| Codex | Reviewer — reviews Gemini's diff before commit, flags issues back to Gemini |

## Git Rules
- Gemini: always `git pull origin main` before starting
- Gemini: only commit after Codex review is clean
- Codex: review only, never commit
- Claude: update AGENTS.md only, never commit code
- Commit messages describe the work (e.g. "add /api/data endpoint"), not the agent
```

- [ ] **Step 2: Create TASKS.md**

```markdown
# GoodEarth KPI — Task List

## Phase 1

- [x] Task 1: Project scaffolding
- [x] Task 2: Agent coordination files
- [ ] Task 3: parseSheet module (TDD)
- [ ] Task 4: Express server + /api/data endpoint
- [ ] Task 5: Frontend shell (warm cream style, layout, header)
- [ ] Task 6: Internal Projects live section (cards + Chart.js)
- [ ] Task 7: Greyed-out placeholder sections
- [ ] Task 8: Deploy to Railway
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md TASKS.md
git commit -m "add agent coordination files"
git push
```

---

## Task 3: parseSheet Module (TDD)

**Files:**
- Create: `src/parseSheet.js`
- Create: `tests/parseSheet.test.js`

The Google Sheet CSV has this structure:
```
Sl no,Projects,Area,Items,Spent (Rs in Crs),Balance (Rs in Crs),Budget Per sft,Projected Pr sft,Impact Per sft,Impact (Rupees in Crs)
1,Motif,,Cost,,,,,,
,,,a. Building,39.77,1.43,2757.23,2459.27,-344.69,-6.25
,,,b. Infra,21.55,0.51,1442.85,1372.9,-92.08,-1.67
2,Octave,,Cost,,,,,,
...
```

Project header rows have a number in `Sl no` and a name in `Projects`. Data rows have blank `Sl no`, and `Items` is either `a. Building` or `b. Infra`.

- [ ] **Step 1: Write the failing tests**

Create `tests/parseSheet.test.js`:

```javascript
const { parseSheet } = require('../src/parseSheet');

const SAMPLE_CSV = `Sl no,Projects,Area,Items,Spent (Rs in Crs),Balance (Rs in Crs),Budget Per sft,Projected Pr sft,Impact Per sft,Impact (Rupees in Crs)
1,Motif,,Cost,,,,,,
,,,a. Building,39.77,1.43,2757.23,2459.27,-344.69,-6.25
,,,b. Infra,21.55,0.51,1442.85,1372.9,-92.08,-1.67
2,Octave,,Cost,,,,,,
,,,a. Building,23.77,17.09,2935.43,2918.63,-16.8,-0.23
,,,b. Infra,21.79,12.13,1556.28,1560.38,4.1,0.37`;

describe('parseSheet', () => {
  let result;

  beforeAll(() => {
    result = parseSheet(SAMPLE_CSV);
  });

  test('returns lastUpdated as a date string', () => {
    expect(result.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns two internal projects', () => {
    expect(result.internalProjects).toHaveLength(2);
  });

  test('first project is Motif', () => {
    expect(result.internalProjects[0].name).toBe('Motif');
  });

  test('Motif building spent is 39.77', () => {
    expect(result.internalProjects[0].financial.building.spent).toBe(39.77);
  });

  test('Motif building balance is 1.43', () => {
    expect(result.internalProjects[0].financial.building.balance).toBe(1.43);
  });

  test('Motif building budgetPerSft is 2757.23', () => {
    expect(result.internalProjects[0].financial.building.budgetPerSft).toBe(2757.23);
  });

  test('Motif building projectedPerSft is 2459.27', () => {
    expect(result.internalProjects[0].financial.building.projectedPerSft).toBe(2459.27);
  });

  test('Motif building impactPerSft is -344.69', () => {
    expect(result.internalProjects[0].financial.building.impactPerSft).toBe(-344.69);
  });

  test('Motif building impactCr is -6.25', () => {
    expect(result.internalProjects[0].financial.building.impactCr).toBe(-6.25);
  });

  test('Motif infra spent is 21.55', () => {
    expect(result.internalProjects[0].financial.infra.spent).toBe(21.55);
  });

  test('Motif status is green (projected < budget)', () => {
    expect(result.internalProjects[0].status).toBe('green');
  });

  test('Octave building status uses building projected vs budget', () => {
    // Octave building: projected 2918.63 vs budget 2935.43 → green
    expect(result.internalProjects[1].status).toBe('green');
  });

  test('returns empty arrays for externalProjects, initiators', () => {
    expect(result.externalProjects).toEqual([]);
    expect(result.initiators).toEqual([]);
  });

  test('returns null for salesMarketing', () => {
    expect(result.salesMarketing).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```

Expected: `Cannot find module '../src/parseSheet'`

- [ ] **Step 3: Create src/parseSheet.js**

```javascript
'use strict';

function parseSheet(csvString) {
  const lines = csvString.split('\n').map(line => line.trim()).filter(Boolean);
  // skip header row
  const rows = lines.slice(1).map(line => parseCsvLine(line));

  const projects = [];
  let currentProject = null;

  for (const row of rows) {
    const slNo = row[0].trim();
    const projectName = row[1].trim();
    const items = row[3].trim();

    if (slNo && !isNaN(Number(slNo)) && projectName) {
      currentProject = { name: projectName, financial: {} };
      projects.push(currentProject);
      continue;
    }

    if (!currentProject) continue;

    if (items === 'a. Building') {
      currentProject.financial.building = extractFinancials(row);
    } else if (items === 'b. Infra') {
      currentProject.financial.infra = extractFinancials(row);
    }
  }

  const internalProjects = projects.map(p => ({
    name: p.name,
    status: deriveStatus(p.financial),
    financial: p.financial,
    construction: null,
    sections: ['financial'],
  }));

  return {
    lastUpdated: new Date().toISOString().slice(0, 10),
    internalProjects,
    externalProjects: [],
    initiators: [],
    salesMarketing: null,
  };
}

function extractFinancials(row) {
  return {
    spent:           parseFloat(row[4]) || 0,
    balance:         parseFloat(row[5]) || 0,
    budgetPerSft:    parseFloat(row[6]) || 0,
    projectedPerSft: parseFloat(row[7]) || 0,
    impactPerSft:    parseFloat(row[8]) || 0,
    impactCr:        parseFloat(row[9]) || 0,
  };
}

function deriveStatus(financial) {
  const b = financial.building;
  if (!b) return 'grey';
  const diff = b.projectedPerSft - b.budgetPerSft;
  if (diff <= 0) return 'green';
  if (diff / b.budgetPerSft <= 0.05) return 'amber';
  return 'red';
}

// Handles quoted fields with commas inside
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

module.exports = { parseSheet };
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```

Expected: `Tests: 14 passed, 14 total`

- [ ] **Step 5: Update TASKS.md**

Mark Task 3 as done:
```
- [x] Task 3: parseSheet module (TDD)
```

- [ ] **Step 6: Commit (after Codex review)**

```bash
git add src/parseSheet.js tests/parseSheet.test.js TASKS.md
git commit -m "add parseSheet module with full test coverage"
git push
```

---

## Task 4: Express Server + /api/data Endpoint

**Files:**
- Create: `server.js`

- [ ] **Step 1: Create server.js**

```javascript
'use strict';

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { parseSheet } = require('./src/parseSheet');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEETS_CSV_URL = process.env.SHEETS_CSV_URL;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', async (req, res) => {
  try {
    if (!SHEETS_CSV_URL) {
      return res.status(500).json({ error: 'SHEETS_CSV_URL not configured' });
    }
    const response = await fetch(SHEETS_CSV_URL, { redirect: 'follow' });
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch sheet', status: response.status });
    }
    const csv = await response.text();
    const data = parseSheet(csv);
    res.json(data);
  } catch (err) {
    console.error('Error in /api/data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`GoodEarth KPI server running at http://localhost:${PORT}`);
});

module.exports = app;
```

- [ ] **Step 2: Verify server starts**

```bash
npm start
```

Expected output: `GoodEarth KPI server running at http://localhost:3000`

- [ ] **Step 3: Test /api/data returns real data**

```bash
curl http://localhost:3000/api/data | python3 -m json.tool
```

Expected: JSON with `internalProjects` array containing Motif, Octave, Ochre, Cadence with correct financial numbers.

- [ ] **Step 4: Verify project names**

```bash
curl -s http://localhost:3000/api/data | python3 -c "import sys,json; d=json.load(sys.stdin); print([p['name'] for p in d['internalProjects']])"
```

Expected: `['Motif', 'Octave', 'Ochre', 'Cadence']`

- [ ] **Step 5: Update TASKS.md**

```
- [x] Task 4: Express server + /api/data endpoint
```

- [ ] **Step 6: Commit (after Codex review)**

```bash
git add server.js TASKS.md
git commit -m "add Express server with /api/data endpoint"
git push
```

---

## Task 5: Frontend Shell — Warm Cream Style, Layout, Header

**Files:**
- Create: `public/index.html` (shell only — header + section skeletons, no data yet)

- [ ] **Step 1: Create public/index.html shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoodEarth KPI Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #faf8f3;
      color: #3a3028;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.6;
    }

    /* Header */
    .site-header {
      background: #fff;
      border-bottom: 1px solid #e8dcc8;
      padding: 20px 40px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .site-header h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: normal;
      color: #8b6914;
      letter-spacing: 0.5px;
    }
    .site-header .updated {
      font-size: 12px;
      color: #b8a888;
    }

    /* Main layout */
    main { max-width: 1100px; margin: 0 auto; padding: 40px 40px 80px; }

    /* Section */
    .section { margin-bottom: 56px; }
    .section-title {
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: normal;
      color: #8b6914;
      border-bottom: 1px solid #e8dcc8;
      padding-bottom: 10px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title .badge {
      font-size: 10px;
      font-family: sans-serif;
      background: #8b6914;
      color: #fff;
      padding: 2px 8px;
      border-radius: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .section-title .badge.soon {
      background: #d4c4a0;
      color: #8b6914;
    }

    /* Project cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .project-card {
      background: #fff;
      border: 1px solid #e8dcc8;
      border-radius: 6px;
      padding: 18px 20px;
    }
    .project-card .project-name {
      font-size: 16px;
      font-weight: 600;
      color: #3a3028;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rag-dot {
      width: 9px; height: 9px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .rag-dot.green  { background: #5a9a5a; }
    .rag-dot.amber  { background: #d48a20; }
    .rag-dot.red    { background: #c0392b; }
    .rag-dot.grey   { background: #ccc; }
    .project-card .stat-label { font-size: 11px; color: #b8a888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; }
    .project-card .stat-value { font-size: 20px; font-weight: 600; color: #3a3028; }
    .project-card .stat-sub   { font-size: 12px; color: #b8a888; }

    /* Progress bar */
    .progress-wrap { margin: 20px 0 8px; }
    .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #8b6914; margin-bottom: 4px; }
    .progress-bar { height: 6px; background: #f0e8d8; border-radius: 3px; }
    .progress-bar-fill { height: 100%; border-radius: 3px; background: #8b6914; transition: width 0.5s ease; }

    /* Detail table */
    .detail-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    .detail-table th { text-align: left; font-weight: 600; color: #8b6914; padding: 6px 10px; border-bottom: 1px solid #e8dcc8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
    .detail-table td { padding: 8px 10px; border-bottom: 1px solid #f5f0e8; }
    .detail-table tr:last-child td { border-bottom: none; }
    .positive { color: #5a9a5a; }
    .negative { color: #c0392b; }

    /* Chart container */
    .chart-wrap { background: #fff; border: 1px solid #e8dcc8; border-radius: 6px; padding: 24px; margin-top: 24px; }
    .chart-title { font-size: 13px; color: #8b6914; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }

    /* Placeholder (greyed-out sections) */
    .placeholder-card {
      background: #f5f2eb;
      border: 1px dashed #d4c4a0;
      border-radius: 6px;
      padding: 32px;
      text-align: center;
      color: #c4b48a;
    }
    .placeholder-card p { font-size: 14px; margin-top: 6px; }

    /* Loading state */
    .loading { text-align: center; padding: 40px; color: #b8a888; font-size: 14px; }
    .error-msg { background: #fdf0f0; border: 1px solid #f0c8c8; border-radius: 6px; padding: 16px; color: #c0392b; font-size: 14px; }
  </style>
</head>
<body>

<header class="site-header">
  <h1>GoodEarth &mdash; KPI Dashboard</h1>
  <span class="updated" id="last-updated">Loading&hellip;</span>
</header>

<main>
  <!-- Internal Projects (live) -->
  <section class="section" id="section-internal">
    <h2 class="section-title">
      Internal Projects
      <span class="badge" id="internal-badge">Live</span>
    </h2>
    <div id="internal-content">
      <div class="loading">Fetching data&hellip;</div>
    </div>
  </section>

  <!-- External Projects (placeholder) -->
  <section class="section">
    <h2 class="section-title">
      External Projects
      <span class="badge soon">Coming Soon</span>
    </h2>
    <div class="placeholder-card">
      <strong>Restoration &amp; Client Interiors</strong>
      <p>Connect your external project data to see KPIs here.</p>
    </div>
  </section>

  <!-- Initiators (placeholder) -->
  <section class="section">
    <h2 class="section-title">
      Initiators
      <span class="badge soon">Coming Soon</span>
    </h2>
    <div class="placeholder-card">
      <strong>Interiors &middot; Home Automation &middot; Furniture</strong>
      <p>Connect your initiator venture data to see KPIs here.</p>
    </div>
  </section>

  <!-- Sales & Marketing (placeholder) -->
  <section class="section">
    <h2 class="section-title">
      Sales &amp; Marketing
      <span class="badge soon">Coming Soon</span>
    </h2>
    <div class="placeholder-card">
      <strong>Pipeline &middot; Campaigns &middot; Push &amp; Pull</strong>
      <p>Connect your sales and marketing data to see KPIs here.</p>
    </div>
  </section>
</main>

<script>
  // Data fetching and rendering will be added in Task 6
</script>

</body>
</html>
```

- [ ] **Step 2: Verify shell in browser**

```bash
npm start
```

Open `http://localhost:3000`. Expected: warm cream page with header "GoodEarth — KPI Dashboard", "Internal Projects (Live)" section showing loading state, three greyed-out placeholder sections below.

- [ ] **Step 3: Update TASKS.md**

```
- [x] Task 5: Frontend shell (warm cream style, layout, header)
```

- [ ] **Step 4: Commit (after Codex review)**

```bash
git add public/index.html TASKS.md
git commit -m "add frontend shell with warm cream styling and placeholder sections"
git push
```

---

## Task 6: Internal Projects — Live Cards + Chart.js

**Files:**
- Modify: `public/index.html` — replace the `<script>` block at the bottom

- [ ] **Step 1: Replace the empty script block in public/index.html**

Find this at the bottom of `public/index.html`:
```html
<script>
  // Data fetching and rendering will be added in Task 6
</script>
```

Replace with:
```html
<script>
'use strict';

async function loadDashboard() {
  const container = document.getElementById('internal-content');
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    document.getElementById('last-updated').textContent = `Last updated: ${data.lastUpdated}`;
    renderInternalProjects(data.internalProjects, container);
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Failed to load data: ${err.message}</div>`;
  }
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(2) : n;
}

function pct(spent, balance) {
  const total = spent + balance;
  return total > 0 ? Math.round((spent / total) * 100) : 0;
}

function renderInternalProjects(projects, container) {
  const html = [];

  // Health card strip
  html.push('<div class="cards-grid">');
  for (const p of projects) {
    const totalSpent = (p.financial.building?.spent || 0) + (p.financial.infra?.spent || 0);
    const totalBalance = (p.financial.building?.balance || 0) + (p.financial.infra?.balance || 0);
    const utilPct = pct(totalSpent, totalBalance);
    html.push(`
      <div class="project-card">
        <div class="project-name">
          <span class="rag-dot ${p.status}"></span>${p.name}
        </div>
        <div class="stat-label">Total Spent</div>
        <div class="stat-value">₹${fmt(totalSpent)} Cr</div>
        <div class="stat-sub">of ₹${fmt(totalSpent + totalBalance)} Cr budget</div>
        <div class="progress-wrap">
          <div class="progress-label"><span>Utilisation</span><span>${utilPct}%</span></div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${utilPct}%"></div></div>
        </div>
      </div>
    `);
  }
  html.push('</div>');

  // Detailed breakdown per project
  for (const p of projects) {
    const b = p.financial.building;
    const infra = p.financial.infra;
    html.push(`
      <details open style="margin-bottom:20px">
        <summary style="cursor:pointer;font-weight:600;color:#8b6914;padding:10px 0;list-style:none;border-bottom:1px solid #e8dcc8">
          ${p.name} — Financial Detail
        </summary>
        <table class="detail-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Spent (Cr)</th>
              <th>Balance (Cr)</th>
              <th>Budget /sft</th>
              <th>Projected /sft</th>
              <th>Impact /sft</th>
              <th>Impact (Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${b ? `<tr>
              <td>Building</td>
              <td>₹${fmt(b.spent)}</td>
              <td>₹${fmt(b.balance)}</td>
              <td>₹${fmt(b.budgetPerSft)}</td>
              <td>₹${fmt(b.projectedPerSft)}</td>
              <td class="${b.impactPerSft <= 0 ? 'positive' : 'negative'}">${b.impactPerSft > 0 ? '+' : ''}${fmt(b.impactPerSft)}</td>
              <td class="${b.impactCr <= 0 ? 'positive' : 'negative'}">${b.impactCr > 0 ? '+' : ''}${fmt(b.impactCr)}</td>
            </tr>` : ''}
            ${infra ? `<tr>
              <td>Infra</td>
              <td>₹${fmt(infra.spent)}</td>
              <td>₹${fmt(infra.balance)}</td>
              <td>₹${fmt(infra.budgetPerSft)}</td>
              <td>₹${fmt(infra.projectedPerSft)}</td>
              <td class="${infra.impactPerSft <= 0 ? 'positive' : 'negative'}">${infra.impactPerSft > 0 ? '+' : ''}${fmt(infra.impactPerSft)}</td>
              <td class="${infra.impactCr <= 0 ? 'positive' : 'negative'}">${infra.impactCr > 0 ? '+' : ''}${fmt(infra.impactCr)}</td>
            </tr>` : ''}
          </tbody>
        </table>
      </details>
    `);
  }

  // Chart: Budget vs Projected per sft (building only)
  html.push(`
    <div class="chart-wrap">
      <div class="chart-title">Budget vs Projected — Building Cost per sft</div>
      <canvas id="cost-chart" height="80"></canvas>
    </div>
  `);

  container.innerHTML = html.join('');

  // Render chart after DOM update
  const labels = projects.map(p => p.name);
  const budgets = projects.map(p => p.financial.building?.budgetPerSft || 0);
  const projected = projects.map(p => p.financial.building?.projectedPerSft || 0);

  new Chart(document.getElementById('cost-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Budget /sft (₹)', data: budgets, backgroundColor: '#d4c4a0', borderRadius: 4 },
        { label: 'Projected /sft (₹)', data: projected, backgroundColor: '#8b6914', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: false, grid: { color: '#f0e8d8' } },
        x: { grid: { display: false } },
      },
    },
  });
}

loadDashboard();
</script>
```

- [ ] **Step 2: Verify in browser**

```bash
npm start
```

Open `http://localhost:3000`. Expected:
- 4 project health cards (Motif, Octave, Ochre, Cadence) with RAG dots and utilisation bars
- Expandable financial detail table per project with correct numbers
- Bar chart comparing budget vs projected per sft for all 4 projects
- Three placeholder sections below still visible

- [ ] **Step 3: Verify Motif numbers match the sheet**

In the Motif detail table:
- Building Spent: ₹39.77, Balance: ₹1.43, Budget/sft: ₹2757.23, Projected/sft: ₹2459.27, Impact/sft: -344.69, Impact Cr: -6.25
- Infra Spent: ₹21.55, Balance: ₹0.51, Budget/sft: ₹1442.85, Projected/sft: ₹1372.90, Impact/sft: -92.08, Impact Cr: -1.67

- [ ] **Step 4: Update TASKS.md**

```
- [x] Task 6: Internal Projects live section (cards + Chart.js)
```

- [ ] **Step 5: Commit (after Codex review)**

```bash
git add public/index.html TASKS.md
git commit -m "add live internal projects section with cards, tables, and chart"
git push
```

---

## Task 7: Final Polish + AGENTS.md Handoff Update

**Files:**
- Modify: `AGENTS.md`
- Modify: `TASKS.md`

- [ ] **Step 1: Manually check all four placeholder sections look good**

Open `http://localhost:3000`. Confirm:
- External Projects placeholder is visible with dashed border
- Initiators placeholder is visible
- Sales & Marketing placeholder is visible
- Page scrolls cleanly, no layout breaks on narrow screen (resize to ~768px wide)

- [ ] **Step 2: Update TASKS.md**

```
- [x] Task 7: Greyed-out placeholder sections
```

- [ ] **Step 3: Update AGENTS.md**

```markdown
## Last Action
Gemini (2026-05-22): Phase 1 frontend complete. All tasks 3–7 done. Ready for Railway deployment.

## Next Action
Claude: Review the deployed Railway URL and confirm Phase 1 is complete. Update this file with Phase 2 kickoff when ready.

## Open Questions / Blockers
None — awaiting Task 8 (Railway deploy).
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md TASKS.md
git commit -m "mark phase 1 frontend complete, update agent handoff"
git push
```

---

## Task 8: Deploy to Railway

- [ ] **Step 1: Create a Railway account and new project**

Go to railway.app → New Project → Deploy from GitHub repo → select `prashanth-palanisamy/ge-kpi`

- [ ] **Step 2: Add environment variable in Railway dashboard**

In Railway project → Variables → Add:
```
SHEETS_CSV_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_4f1jTZ3RY__MgbS2YrcGgxXYK-Q9UfM5IEqIy-Zsra6Lm4nKGBjfNPLqVnlZxREethc9lU86JIHS/pub?output=csv
```

- [ ] **Step 3: Add Railway start command**

Railway needs to know how to start the app. Create `railway.json` in the repo root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

```bash
git add railway.json
git commit -m "add Railway deployment config"
git push
```

- [ ] **Step 4: Provision PostgreSQL on Railway**

In Railway → New → Database → PostgreSQL. This stays dormant in Phase 1 but is provisioned and ready. No code changes needed.

- [ ] **Step 5: Verify deployment**

Once Railway finishes deploying, open the generated Railway URL (e.g. `ge-kpi.up.railway.app`).

Expected: Same dashboard as localhost — all 4 project cards, chart, placeholder sections.

- [ ] **Step 6: Update TASKS.md and AGENTS.md**

TASKS.md:
```
- [x] Task 8: Deploy to Railway
```

AGENTS.md:
```markdown
## Last Action
Gemini (2026-05-22): Phase 1 complete. Deployed to Railway. Dashboard live.

## Next Action
Claude: Phase 1 sign-off. Plan Phase 2 (monthly snapshots + project CRUD) when ready.

## Open Questions / Blockers
None.
```

- [ ] **Step 7: Final commit**

```bash
git add TASKS.md AGENTS.md
git commit -m "phase 1 complete: deployed to Railway"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ Node.js + Express on Railway — Task 4, 8
- ✅ `/api/data` endpoint — Task 4
- ✅ parseSheet with internal schema — Task 3
- ✅ Warm cream visual style — Task 5
- ✅ 4 project health cards with RAG — Task 6
- ✅ Financial detail tables — Task 6
- ✅ Chart.js bar chart — Task 6
- ✅ Placeholder sections (External, Initiators, Sales & Marketing) — Task 5
- ✅ PostgreSQL provisioned — Task 8
- ✅ AGENTS.md + TASKS.md + Git workflow — Task 2
- ✅ GitHub repo — Task 1
- ✅ `.env` not committed, `.env.example` committed — Task 1

**No placeholders, no TODOs, no missing code.**
