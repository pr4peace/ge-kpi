'use strict';

const COL_SL_NO        = 0;
const COL_PROJECT      = 1;
const COL_ITEMS        = 3;
const COL_SPENT        = 4;
const COL_BALANCE      = 5;
const COL_BUDGET_SFT   = 6;
const COL_PROJECTED_SFT = 7;
const COL_IMPACT_SFT   = 8;
const COL_IMPACT_CR    = 9;

function parseSheet(csvString) {
  const lines = csvString.split('\n').map(line => line.trim()).filter(Boolean);
  // skip header row
  const rows = lines.slice(1).map(line => parseCsvLine(line));

  const projects = [];
  let currentProject = null;

  for (const row of rows) {
    const slNo = row[COL_SL_NO].trim();
    const projectName = row[COL_PROJECT].trim();
    const items = row[COL_ITEMS].trim();

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
    spent:           parseFloat(row[COL_SPENT])        || 0,
    balance:         parseFloat(row[COL_BALANCE])      || 0,
    budgetPerSft:    parseFloat(row[COL_BUDGET_SFT])   || 0,
    projectedPerSft: parseFloat(row[COL_PROJECTED_SFT]) || 0,
    impactPerSft:    parseFloat(row[COL_IMPACT_SFT])   || 0,
    impactCr:        parseFloat(row[COL_IMPACT_CR])    || 0,
  };
}

// Status is derived from building cost only — infra is not considered for overall project RAG.
// Amber threshold = 5% over budget (business rule): 0 < diff/budget <= 0.05 → amber, > 0.05 → red.
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
  return result.map(f => f.replace(/\r$/, ''));
}

module.exports = { parseSheet };
