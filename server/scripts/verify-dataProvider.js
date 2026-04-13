/**
 * Manual / CI-friendly checks for dataProvider (requires network).
 * Usage: node scripts/verify-dataProvider.js
 */
const assert = require('assert');
const {
  getOHLCData,
  isWithinNSEIntradaySessionIST,
  formatTimestampIST,
} = require('../utils/dataProvider');

function sessionMinutes(ts) {
  const t = ts.split(' ')[1];
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

async function main() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 4);
  const pad = (n) => String(n).padStart(2, '0');
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  const startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;

  const c1 = await getOHLCData('NIFTY', startDate, endDate, '1min');
  assert(c1.length > 0, '1min: expected candles');
  assert(c1[0].timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/), 'timestamp format');
  for (const row of c1) {
    const hm = sessionMinutes(row.timestamp);
    assert(hm >= 9 * 60 + 15 && hm <= 15 * 60 + 30, `outside session: ${row.timestamp}`);
  }

  const c5 = await getOHLCData('NIFTY', startDate, endDate, '5min');
  assert(c5.length > 0, '5min: expected candles');
  for (const row of c5) {
    const hm = sessionMinutes(row.timestamp);
    assert(hm >= 9 * 60 + 15 && hm <= 15 * 60 + 30, `5m outside session: ${row.timestamp}`);
    assert((hm - (9 * 60 + 15)) % 5 === 0, `5m bucket align: ${row.timestamp}`);
  }

  const c1b = await getOHLCData('NIFTY', startDate, endDate, '1min');
  assert.deepStrictEqual(c1b, c1, 'cache: same input must yield identical output');

  const d = new Date('2026-04-10T04:00:00.000Z');
  assert(isWithinNSEIntradaySessionIST(d), 'IST session helper');
  assert(formatTimestampIST(d).includes('09:'), 'IST format');

  console.log('verify-dataProvider: OK', { startDate, endDate, n1: c1.length, n5: c5.length });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
