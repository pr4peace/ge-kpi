'use strict';

/**
 * Reads the Ochre construction XLS and pushes it into Google Sheets.
 *
 * Usage:
 *   node scripts/push-schedule.js <path-to-xls>
 *
 * Requires in .env:
 *   SPREADSHEET_ID       — the financial spreadsheet (or SCHEDULE_SPREADSHEET_ID if separate)
 *   GOOGLE_SERVICE_ACCOUNT_KEY — path to your service account JSON, e.g. ./credentials.json
 */

require('dotenv').config();
const XLSX     = require('xlsx');
const { google } = require('googleapis');
const path     = require('path');
const fs       = require('fs');

const XLS_PATH       = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'Ochre Construction Schedule Progress 20 May 2026.xls');
const SPREADSHEET_ID = process.env.SCHEDULE_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
const KEY_PATH       = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './credentials.json';

// Columns in the XLS that are date/blank — not progress values
const SKIP_COLS = new Set([0, 7, 10, 18, 22, 24, 28]);

// ── Auth ──────────────────────────────────────────────────────────────────────
function getAuth() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`\nService account key not found at: ${KEY_PATH}`);
    console.error('See README for how to create one — it takes about 2 minutes.\n');
    process.exit(1);
  }
  const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ── Read XLS ──────────────────────────────────────────────────────────────────
function readXLS() {
  const wb = XLSX.readFile(XLS_PATH, { cellDates: false });

  // Townhouses
  const town = XLSX.utils.sheet_to_json(wb.Sheets['Townhouses'], { header: 1, defval: '' });
  const infraRaw = XLSX.utils.sheet_to_json(wb.Sheets['Infrastructure'], { header: 1, defval: '' });

  return { town, infraRaw };
}

// ── Build sheet values ────────────────────────────────────────────────────────
function buildTownhousesGrid(town) {
  const headerRow = town[1] || [];

  // Collect progress column indices + clean names
  const stageCols = [];
  for (let c = 0; c < headerRow.length; c++) {
    if (SKIP_COLS.has(c)) continue;
    const name = String(headerRow[c]).trim();
    if (!name || name === 'Sl no') continue;
    stageCols.push({ c, name });
  }

  // Output header
  const grid = [['Unit', ...stageCols.map(s => s.name)]];

  for (let r = 3; r < town.length; r++) {
    const row = town[r] || [];
    const unit = String(row[1] || '').trim();
    if (!unit.startsWith('Plot')) continue;

    const out = [unit];
    for (const { c } of stageCols) {
      const raw = String(row[c] || '').trim().toLowerCase();
      if (!raw || raw === 'nil') {
        out.push('N/A');
      } else {
        const n = parseFloat(raw);
        if (isNaN(n))        out.push('N/A');
        else if (n >= 1)     out.push('Complete');
        else if (n >= 0.75)  out.push('In Progress (75%)');
        else if (n >= 0.5)   out.push('In Progress (50%)');
        else if (n > 0)      out.push('In Progress (25%)');
        else                 out.push('Not Started');
      }
    }
    grid.push(out);
  }
  return grid;
}

function buildInfraGrid(infraRaw) {
  const headers = infraRaw[0] || [];
  const data    = infraRaw[2] || [];

  const grid = [['Item', 'Progress']];
  for (let c = 1; c < headers.length; c++) {
    const name = String(headers[c]).trim();
    if (!name) continue;
    const raw = String(data[c] || '').trim().toLowerCase();
    let val = 'Not Started';
    if (!raw || raw === 'nil') val = 'N/A';
    else {
      const n = parseFloat(raw);
      if (!isNaN(n)) {
        if (n >= 1)    val = 'Complete';
        else if (n >= 0.75) val = 'In Progress (75%)';
        else if (n >= 0.5)  val = 'In Progress (50%)';
        else if (n > 0)     val = 'In Progress (25%)';
      }
    }
    grid.push([name, val]);
  }
  return grid;
}

// ── Sheets API helpers ────────────────────────────────────────────────────────
async function getOrCreateSheet(sheets, spreadsheetId, title) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const existing = meta.data.sheets.find(s => s.properties.title === title);
  if (existing) return existing.properties.sheetId;

  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  return res.data.replies[0].addSheet.properties.sheetId;
}

async function clearAndWrite(sheets, spreadsheetId, sheetTitle, grid) {
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: sheetTitle });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: grid },
  });
  console.log(`  ✓ "${sheetTitle}" — ${grid.length - 1} rows, ${grid[0].length} columns`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SPREADSHEET_ID) {
    console.error('Set SCHEDULE_SPREADSHEET_ID (or SPREADSHEET_ID) in .env');
    process.exit(1);
  }

  console.log(`Reading: ${XLS_PATH}`);
  const { town, infraRaw } = readXLS();
  const townGrid  = buildTownhousesGrid(town);
  const infraGrid = buildInfraGrid(infraRaw);

  console.log(`Authenticating with service account…`);
  const auth   = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`Writing to spreadsheet: ${SPREADSHEET_ID}`);
  await getOrCreateSheet(sheets, SPREADSHEET_ID, 'Ochre Townhouses');
  await getOrCreateSheet(sheets, SPREADSHEET_ID, 'Ochre Infrastructure');

  await clearAndWrite(sheets, SPREADSHEET_ID, 'Ochre Townhouses',     townGrid);
  await clearAndWrite(sheets, SPREADSHEET_ID, 'Ochre Infrastructure', infraGrid);

  console.log('\nDone. PMs can now update values directly in the sheet.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
