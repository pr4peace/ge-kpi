'use strict';

// Maps column name substrings → phase key
// Order matters: first match wins
const PHASE_MAP = [
  { key: 'foundation',  label: 'Foundation',   terms: ['compound wall','pile','plinth beam','stub'] },
  { key: 'groundFloor', label: 'Ground Floor',  terms: ['gf ','gf\t',' gf','stilt floor plinth','columns and lift wall g','stilt floor columns','gf blockwork','stilt floor columns gf','gf lintel','stilt floor lintel','gf slab','stilt floor slab'] },
  { key: 'firstFloor',  label: 'First Floor',   terms: ['ff ','ff\t',' ff','ff columns','ff blockwork','ff lift','ff lintel','ff slab'] },
  { key: 'secondFloor', label: 'Second Floor',  terms: ['sf ','sf\t',' sf','sf blockwork','sf lift','sf lintel','sf slab'] },
  { key: 'finishing',   label: 'Finishing',     terms: ['wall conduit','door frame','plaster','plumbing','flooring','carpentry','paint','polish','electrical','cp fitting','handover'] },
];

function colPhase(colName) {
  const lower = colName.toLowerCase();
  for (const { key, terms } of PHASE_MAP) {
    if (terms.some(t => lower.includes(t))) return key;
  }
  return 'finishing'; // default unknown cols to finishing
}

// Accepts text labels or raw 0–1 numbers
function parseProgress(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim().toLowerCase();
  if (!s || s === 'nil' || s === 'n/a') return null;
  if (s === 'complete')        return 1;
  if (s.includes('75'))        return 0.75;
  if (s.includes('50'))        return 0.5;
  if (s.includes('25'))        return 0.25;
  if (s === 'in progress')     return 0.25;
  if (s === 'not started')     return 0;
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.min(1, Math.max(0, n));
}

// ── Townhouses ────────────────────────────────────────────────────────────────
// Expected: Row 0 = ["Unit", ...stage names], Rows 1+ = ["Plot XX", ...values]
function parseTownhouses(rows) {
  if (!rows || rows.length < 2) return { plots: [], summary: { totalPlots: 0, avgCompletion: 0, phaseSummary: {} } };

  const headers = rows[0];
  // Map each stage column → phase key
  const stageCols = headers.slice(1).map((name, i) => ({ name, col: i + 1, phase: colPhase(name) }));

  const phaseKeys = ['foundation','groundFloor','firstFloor','secondFloor','finishing'];
  const phaseLabels = { foundation:'Foundation', groundFloor:'Ground Floor', firstFloor:'First Floor', secondFloor:'Second Floor', finishing:'Finishing' };

  const plots = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const unit = (row[0] || '').toString().trim();
    if (!unit.toLowerCase().startsWith('plot')) continue;

    // Group progress values by phase
    const phaseVals = {};
    for (const key of phaseKeys) phaseVals[key] = [];

    let totalApplicable = 0, totalDone = 0;
    for (const { col, phase } of stageCols) {
      const v = parseProgress(row[col]);
      if (v !== null) {
        phaseVals[phase].push(v);
        totalApplicable++;
        totalDone += v;
      }
    }

    const phases = {};
    for (const key of phaseKeys) {
      const vals = phaseVals[key];
      phases[key] = {
        label: phaseLabels[key],
        pct:   vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
      };
    }

    const overallPct = totalApplicable > 0 ? totalDone / totalApplicable : 0;

    let currentPhase = 'Foundation';
    for (const key of phaseKeys) {
      if (phases[key].pct !== null && phases[key].pct > 0) currentPhase = phaseLabels[key];
    }

    plots.push({ plot: unit, phases, overallPct, currentPhase });
  }

  // Summary per phase
  const phaseSummary = {};
  for (const key of phaseKeys) {
    const applicable = plots.filter(p => p.phases[key].pct !== null);
    phaseSummary[key] = {
      label:      phaseLabels[key],
      done:       applicable.filter(p => p.phases[key].pct >= 1).length,
      inProgress: applicable.filter(p => p.phases[key].pct > 0 && p.phases[key].pct < 1).length,
      notStarted: applicable.filter(p => p.phases[key].pct === 0).length,
      na:         plots.length - applicable.length,
      total:      applicable.length,
    };
  }

  const avgCompletion = plots.length ? plots.reduce((s, p) => s + p.overallPct, 0) / plots.length : 0;
  return { plots, summary: { totalPlots: plots.length, avgCompletion, phaseSummary } };
}

// ── Infrastructure ────────────────────────────────────────────────────────────
// Expected: Row 0 = ["Item","Progress"], Rows 1+ = [name, value]
function parseInfrastructure(rows) {
  if (!rows || rows.length < 2) return { items: [], avgProgress: 0 };
  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const name     = (rows[r][0] || '').toString().trim();
    const progress = parseProgress(rows[r][1]);
    if (name && progress !== null) items.push({ name, progress });
  }
  const avgProgress = items.length ? items.reduce((s, i) => s + i.progress, 0) / items.length : 0;
  return { items, avgProgress };
}

module.exports = { parseTownhouses, parseInfrastructure };
