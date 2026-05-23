'use strict';

require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');
const { parseFinancialSheet }                  = require('./src/parseSheet');
const { parseTownhouses, parseInfrastructure } = require('./src/parseScheduleSheet');
const { parseMaterialSheet }                   = require('./src/parseMaterialSheet');

const app  = express();
const PORT = process.env.PORT || 3000;

const SHEETS_API_KEY  = process.env.SHEETS_API_KEY;
const SPREADSHEET_ID  = process.env.SPREADSHEET_ID;
const FINANCIAL_SHEET = process.env.FINANCIAL_SHEET_NAME || 'Project Accounts';
const MATERIAL_SHEET  = process.env.MATERIAL_SHEET_NAME  || 'Materials';

// Optional: separate spreadsheet for construction schedules
const SCHEDULE_SPREADSHEET_ID = process.env.SCHEDULE_SPREADSHEET_ID;
const TOWNHOUSES_SHEET         = process.env.TOWNHOUSES_SHEET_NAME  || 'Townhouses';
const INFRA_SHEET              = process.env.INFRA_SHEET_NAME       || 'Infrastructure';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function fetchRows(spreadsheetId, sheetName) {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${SHEETS_API_KEY}`;
  const res  = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error for "${sheetName}" (${res.status}): ${body}`);
  }
  const json = await res.json();
  return json.values || [];
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/sheets', async (req, res) => {
  try {
    if (!SHEETS_API_KEY || !SPREADSHEET_ID)
      return res.status(500).json({ error: 'SHEETS_API_KEY or SPREADSHEET_ID not configured' });
    const url      = `${BASE}/${SPREADSHEET_ID}?key=${SHEETS_API_KEY}&fields=sheets.properties`;
    const response = await fetch(url);
    if (!response.ok)
      return res.status(502).json({ error: 'Failed to fetch sheet list', status: response.status });
    const json = await response.json();
    res.json(json.sheets.map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId })));
  } catch (err) {
    console.error('Error in /api/sheets:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    if (!SHEETS_API_KEY || !SPREADSHEET_ID)
      return res.status(500).json({ error: 'SHEETS_API_KEY or SPREADSHEET_ID not configured' });

    const [financialRows, materialRows] = await Promise.all([
      fetchRows(SPREADSHEET_ID, FINANCIAL_SHEET),
      fetchRows(SPREADSHEET_ID, MATERIAL_SHEET).catch(() => null),
    ]);

    const data = parseFinancialSheet(financialRows);
    data.materials = materialRows ? parseMaterialSheet(materialRows) : [];

    // Construction schedule — optional; only fetched if SCHEDULE_SPREADSHEET_ID is set
    if (SCHEDULE_SPREADSHEET_ID) {
      try {
        const [townRows, infraRows] = await Promise.all([
          fetchRows(SCHEDULE_SPREADSHEET_ID, TOWNHOUSES_SHEET),
          fetchRows(SCHEDULE_SPREADSHEET_ID, INFRA_SHEET),
        ]);
        data.scheduleData = {
          ochre: {
            townhouses:     parseTownhouses(townRows),
            infrastructure: parseInfrastructure(infraRows),
          },
        };
      } catch (e) {
        console.warn('Schedule data unavailable:', e.message);
        data.scheduleData = null;
      }
    } else {
      data.scheduleData = null;
    }

    res.json(data);
  } catch (err) {
    console.error('Error in /api/data:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GoodEarth KPI server running at http://localhost:${PORT}`);
});

module.exports = app;
