'use strict';

// Material sheet structure (per row):
// Col 0: project name (only on first row of each project)
// Col 2: material name ("a. Steel", "b. Cement", etc.)
// Col 3: unit
// Col 4: budget quantity
// Col 5: pending quantity (yet to procure)
// Col 6: avg rate
// Col 7: to be spent (₹)

function parseMaterialSheet(rows) {
  const projects = {};
  let currentProject = null;

  for (const row of rows) {
    if (!row || !row.length) continue;

    const projectName = (row[0] || '').toString().trim();
    const materialRaw = (row[2] || '').toString().trim();

    if (projectName) currentProject = projectName;
    if (!currentProject || !materialRaw) continue;

    const materialName = materialRaw.replace(/^[a-z]\.\s*/i, '').trim();
    if (!materialName) continue;

    const budgetQty  = parseFloat(row[4]) || 0;
    const pendingQty = parseFloat(row[5]) || 0;
    const avgRate    = parseFloat(row[6]) || 0;
    const toBeSpent  = parseFloat(row[7]) || 0;

    // Only include rows that have at least budget quantity
    if (!budgetQty && !toBeSpent) continue;

    if (!projects[currentProject]) projects[currentProject] = { name: currentProject, materials: [] };

    const procuredQty = budgetQty - pendingQty;
    const procuredPct = budgetQty > 0 ? Math.round((procuredQty / budgetQty) * 100) : 0;

    projects[currentProject].materials.push({
      name:        materialName,
      unit:        (row[3] || '').toString().trim(),
      budgetQty,
      pendingQty,
      procuredQty,
      procuredPct,
      avgRate,
      toBeSpentCr: toBeSpent / 1e7, // convert ₹ to Cr
    });
  }

  // Compute per-project summary
  return Object.values(projects).map(p => ({
    ...p,
    totalToBeSpentCr: p.materials.reduce((s, m) => s + m.toBeSpentCr, 0),
  }));
}

module.exports = { parseMaterialSheet };
