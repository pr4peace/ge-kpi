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
