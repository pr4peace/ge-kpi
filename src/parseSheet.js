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
