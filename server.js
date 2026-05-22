'use strict';

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { parseFinancialSheet } = require('./src/parseSheet');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEETS_API_KEY  = process.env.SHEETS_API_KEY;
const SPREADSHEET_ID  = process.env.SPREADSHEET_ID;
const FINANCIAL_SHEET = process.env.FINANCIAL_SHEET_NAME || 'Project Accounts';
const MATERIAL_SHEET  = process.env.MATERIAL_SHEET_NAME  || 'Materials';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function fetchRows(sheetName) {
  const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${SHEETS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error for "${sheetName}" (${res.status}): ${body}`);
  }
  const json = await res.json();
  return json.values || [];
}

app.use(express.static(path.join(__dirname, 'public')));

// Lists all sheet tab names — useful for finding the right sheet names to configure
app.get('/api/sheets', async (req, res) => {
  try {
    if (!SHEETS_API_KEY || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'SHEETS_API_KEY or SPREADSHEET_ID not configured' });
    }
    const url = `${BASE}/${SPREADSHEET_ID}?key=${SHEETS_API_KEY}&fields=sheets.properties`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch sheet list', status: response.status });
    }
    const json = await response.json();
    res.json(json.sheets.map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId })));
  } catch (err) {
    console.error('Error in /api/sheets:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    if (!SHEETS_API_KEY || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'SHEETS_API_KEY or SPREADSHEET_ID not configured' });
    }

    const [financialRows, materialRows] = await Promise.all([
      fetchRows(FINANCIAL_SHEET),
      fetchRows(MATERIAL_SHEET).catch(() => null), // materials optional — don't break if sheet name wrong
    ]);

    const data = parseFinancialSheet(financialRows);
    // Include raw material rows so we can inspect the structure and build a parser
    data.materialsRaw = materialRows;
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
