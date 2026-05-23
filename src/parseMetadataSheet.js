'use strict';

/**
 * Parses the Metadata sheet.
 * Expected columns: Tab | Last Updated (YYYY-MM-DD) | Updated By | Notes
 * Returns: { [tabName]: { lastUpdated, updatedBy, notes, daysAgo } }
 */
function parseMetadataSheet(rows) {
  if (!rows || rows.length < 2) return {};
  const result = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < rows.length; i++) {
    const [tab, lastUpdated, updatedBy, notes] = rows[i];
    if (!tab) continue;
    const key = tab.trim();
    let daysAgo = null;
    if (lastUpdated) {
      const d = new Date(lastUpdated.trim());
      if (!isNaN(d)) daysAgo = Math.floor((today - d) / 86400000);
    }
    result[key] = {
      lastUpdated: lastUpdated ? lastUpdated.trim() : null,
      updatedBy:   updatedBy   ? updatedBy.trim()   : null,
      notes:       notes       ? notes.trim()        : null,
      daysAgo,
    };
  }
  return result;
}

module.exports = { parseMetadataSheet };
