/**
 * NSE historical OHLC via Yahoo Finance (yahoo-finance2).
 * Timestamps: Asia/Kolkata (IST), formatted YYYY-MM-DD HH:mm:ss.
 * Intraday candles restricted to cash session 09:15–15:30 IST, weekdays only.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const YahooFinanceClass = require('yahoo-finance2').default;
/** yahoo-finance2 v3: default export is the class; instantiate once. */
const yahooFinance = new YahooFinanceClass();

const CACHE_DIR = path.join(__dirname, '..', '.cache', 'ohlc');
const IST_TZ = 'Asia/Kolkata';

/** NSE cash market session in IST (inclusive). */
const SESSION_START_MIN = 9 * 60 + 15; // 09:15
const SESSION_END_MIN = 15 * 60 + 30; // 15:30

/** Max span per Yahoo chart request (intraday) to avoid empty/truncated responses. */
const INTRADAY_CHUNK_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/** In-memory cache (small LRU) for identical requests in-process. */
const memoryCache = new Map();
const MEMORY_CACHE_MAX = 32;

const INSTRUMENT_MAP = {
  NIFTY: '^NSEI',
  BANKNIFTY: '^NSEBANK',
  /** NSE Fin Nifty–linked ETF (Yahoo has no stable ^ index ticker for FINNIFTY). */
  FINNIFTY: 'NIFTY_FIN_SERVICE.NS',
  GOLDBEES: 'GOLDBEES.NS',
};

/**
 * Normalized timeframe → Yahoo chart interval + bar width in minutes (for resampling).
 */
const TIMEFRAME_CONFIG = {
  '1min': { yahoo: '1m', minutes: 1 },
  '1m': { yahoo: '1m', minutes: 1 },
  '5min': { yahoo: '5m', minutes: 5 },
  '5m': { yahoo: '5m', minutes: 5 },
  '15min': { yahoo: '15m', minutes: 15 },
  '15m': { yahoo: '15m', minutes: 15 },
  '1hour': { yahoo: '1h', minutes: 60 },
  '1h': { yahoo: '1h', minutes: 60 },
  '1day': { yahoo: '1d', minutes: 1440 },
  '1d': { yahoo: '1d', minutes: 1440 },
};

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheKey(symbol, startDate, endDate, timeframe) {
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify({ symbol, startDate, endDate, timeframe }));
  return h.digest('hex');
}

function readDiskCache(key) {
  try {
    const fp = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDiskCache(key, payload) {
  try {
    ensureCacheDir();
    const fp = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(fp, JSON.stringify(payload), 'utf8');
  } catch (e) {
    console.warn('[dataProvider] cache write failed:', e.message);
  }
}

function touchMemoryCache(key, candles) {
  if (memoryCache.size >= MEMORY_CACHE_MAX) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
  memoryCache.set(key, candles);
}

/**
 * Format Date as YYYY-MM-DD HH:mm:ss in IST (no timezone suffix in string).
 */
function formatTimestampIST(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const g = (t) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
}

/**
 * Weekday in IST: 0=Sun … 6=Sat
 */
function getISTWeekday(date) {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TZ,
    weekday: 'short',
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[short] ?? 1;
}

/**
 * Minutes from midnight IST for this instant.
 */
function getISTMinutesFromMidnight(date) {
  const s = formatTimestampIST(date);
  const time = s.slice(11); // HH:mm:ss
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
}

/**
 * True if date falls on Sat/Sun in IST.
 */
function isISTWeekend(date) {
  const wd = getISTWeekday(date);
  return wd === 0 || wd === 6;
}

/**
 * Intraday: bar is inside NSE cash session (09:15–15:30 IST inclusive).
 */
function isWithinNSEIntradaySessionIST(date) {
  if (isISTWeekend(date)) return false;
  const hm = getISTMinutesFromMidnight(date);
  return hm >= SESSION_START_MIN && hm <= SESSION_END_MIN;
}

function normalizeTimeframe(tf) {
  if (!tf || typeof tf !== 'string') return '1min';
  const key = tf.trim();
  if (TIMEFRAME_CONFIG[key]) return key;
  const lower = key.toLowerCase();
  const aliases = {
    '1min': '1min',
    '1 minute': '1min',
    '5min': '5min',
    '5 minutes': '5min',
    '15min': '15min',
    '15 minutes': '15min',
    '1hour': '1hour',
    '1 hour': '1hour',
    '60min': '1hour',
    '1day': '1day',
    '1 day': '1day',
  };
  return aliases[lower] || key;
}

function resolveSymbol(instrument) {
  if (!instrument || typeof instrument !== 'string') {
    throw new Error('Instrument is required');
  }
  const u = instrument.trim().toUpperCase();
  const sym = INSTRUMENT_MAP[u];
  if (!sym) {
    const valid = Object.keys(INSTRUMENT_MAP).join(', ');
    throw new Error(`Unknown instrument "${instrument}". Supported: ${valid}`);
  }
  return sym;
}

function parsePeriodBounds(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error('Invalid date format; use YYYY-MM-DD');
  }
  const period1 = new Date(`${startDate}T00:00:00+05:30`);
  const period2 = new Date(`${endDate}T23:59:59.999+05:30`);
  if (Number.isNaN(period1.getTime()) || Number.isNaN(period2.getTime())) {
    throw new Error('Invalid calendar dates');
  }
  if (period1 >= period2) {
    throw new Error('startDate must be before endDate');
  }
  return { period1, period2 };
}

/**
 * Split [start,end] into chunks of at most maxMs span.
 */
function chunkDateRange(start, end, maxMs) {
  const chunks = [];
  let t = start.getTime();
  const endT = end.getTime();
  while (t < endT) {
    const t2 = Math.min(t + maxMs, endT);
    if (t2 > t) {
      chunks.push({ from: new Date(t), to: new Date(t2) });
    }
    t = t2;
    if (t < endT) t += 1;
  }
  return chunks;
}

async function fetchChartChunk(symbol, period1, period2, interval) {
  const result = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval,
    includePrePost: false,
    return: 'array',
  });
  return result.quotes || [];
}

/**
 * Raw Yahoo quotes → normalized rows, drop invalid OHLC.
 */
function normalizeQuotes(quotes) {
  const out = [];
  for (const q of quotes) {
    if (!q || !q.date) continue;
    const { open, high, low, close, volume, date } = q;
    if (
      open == null ||
      high == null ||
      low == null ||
      close == null ||
      Number.isNaN(+open) ||
      Number.isNaN(+high) ||
      Number.isNaN(+low) ||
      Number.isNaN(+close)
    ) {
      continue;
    }
    out.push({
      date: date instanceof Date ? date : new Date(date),
      open: +open,
      high: +high,
      low: +low,
      close: +close,
      volume: volume != null && !Number.isNaN(+volume) ? +volume : 0,
    });
  }
  return out;
}

function dedupeSortCandles(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = Math.floor(r.date.getTime() / 1000);
    if (!map.has(k) || r.date >= map.get(k).date) {
      map.set(k, r);
    }
  }
  return [...map.values()].sort((a, b) => a.date - b.date);
}

/**
 * Intraday: keep only NSE session in IST, weekdays.
 */
function filterIntradaySession(rows) {
  return rows.filter((r) => isWithinNSEIntradaySessionIST(r.date));
}

/**
 * Daily bars: keep weekdays only (IST); drop Sat/Sun.
 */
function filterDailyWeekdays(rows) {
  return rows.filter((r) => !isISTWeekend(r.date));
}

/**
 * IST calendar day key YYYY-MM-DD for grouping daily bars.
 */
function istDayKey(date) {
  return formatTimestampIST(date).slice(0, 10);
}

/**
 * Bucket start (minutes from midnight IST) for intraday resampling, or null if outside session.
 */
function bucketStartMinutesIST(date, barMinutes) {
  if (!isWithinNSEIntradaySessionIST(date)) return null;
  const hm = getISTMinutesFromMidnight(date);
  const rel = hm - SESSION_START_MIN;
  if (rel < 0) return null;
  const idx = Math.floor(rel / barMinutes);
  const start = SESSION_START_MIN + idx * barMinutes;
  if (start > SESSION_END_MIN) return null;
  return start;
}

/**
 * Build Date in IST for given YYYY-MM-DD and minutes-from-midnight IST (interpreted as wall clock).
 */
function istWallTimeToUTCDate(dayYmd, minutesFromMidnight) {
  const [y, m, d] = dayYmd.split('-').map(Number);
  const hh = Math.floor(minutesFromMidnight / 60);
  const mm = minutesFromMidnight % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const isoLocal = `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00`;
  return new Date(`${isoLocal}+05:30`);
}

/**
 * Resample intraday 1m (or finer) candles to barMinutes (5, 15, 60).
 */
function resampleIntraday(rows, barMinutes) {
  if (barMinutes <= 1) return rows;
  const groups = new Map();
  for (const r of rows) {
    const day = istDayKey(r.date);
    const startMin = bucketStartMinutesIST(r.date, barMinutes);
    if (startMin == null) continue;
    const key = `${day}|${startMin}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const [da, ma] = a.split('|');
    const [db, mb] = b.split('|');
    if (da !== db) return da.localeCompare(db);
    return Number(ma) - Number(mb);
  });
  const out = [];
  for (const key of keys) {
    const arr = groups.get(key).sort((a, b) => a.date - b.date);
    if (!arr.length) continue;
    const [day, sm] = key.split('|');
    const bucketDate = istWallTimeToUTCDate(day, Number(sm));
    out.push({
      date: bucketDate,
      open: arr[0].open,
      high: Math.max(...arr.map((x) => x.high)),
      low: Math.min(...arr.map((x) => x.low)),
      close: arr[arr.length - 1].close,
      volume: arr.reduce((s, x) => s + x.volume, 0),
    });
  }
  return out;
}

function toOutputCandle(row, isDaily) {
  return {
    timestamp: isDaily ? `${istDayKey(row.date)} 15:30:00` : formatTimestampIST(row.date),
    open: +row.open.toFixed(2),
    high: +row.high.toFixed(2),
    low: +row.low.toFixed(2),
    close: +row.close.toFixed(2),
    volume: Math.round(row.volume),
  };
}

async function fetchIntradayMerged(symbol, period1, period2, yahooInterval) {
  const chunks = chunkDateRange(period1, period2, INTRADAY_CHUNK_MS);
  const all = [];
  for (const { from, to } of chunks) {
    if (from >= to) continue;
    try {
      const quotes = await fetchChartChunk(symbol, from, to, yahooInterval);
      all.push(...normalizeQuotes(quotes));
    } catch (e) {
      console.warn(`[dataProvider] chunk failed ${from.toISOString()}–${to.toISOString()}:`, e.message);
    }
  }
  return dedupeSortCandles(all);
}

async function fetchDailyMerged(symbol, period1, period2) {
  const chunks = chunkDateRange(period1, period2, 365 * 24 * 60 * 60 * 1000);
  const all = [];
  for (const { from, to } of chunks) {
    if (from >= to) continue;
    const quotes = await fetchChartChunk(symbol, from, to, '1d');
    all.push(...normalizeQuotes(quotes));
  }
  return dedupeSortCandles(all);
}

/**
 * Fetch OHLCV for backtesting.
 * @param {string} instrument - NIFTY | BANKNIFTY | FINNIFTY | GOLDBEES
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} timeframe - 1min | 5min | 15min | 1hour | 1day
 * @returns {Promise<Array<{timestamp,open,high,low,close,volume}>>}
 */
async function getOHLCData(instrument, startDate, endDate, timeframe = '1min') {
  const symbol = resolveSymbol(instrument);
  const tf = normalizeTimeframe(timeframe);
  const cfg = TIMEFRAME_CONFIG[tf];
  if (!cfg) {
    throw new Error(
      `Unsupported timeframe "${timeframe}". Use: 1min, 5min, 15min, 1hour, 1day`
    );
  }

  const key = cacheKey(symbol, startDate, endDate, tf);
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  const disk = readDiskCache(key);
  if (disk && Array.isArray(disk.candles)) {
    touchMemoryCache(key, disk.candles);
    return disk.candles;
  }

  const { period1, period2 } = parsePeriodBounds(startDate, endDate);
  let rows = [];

  try {
    if (cfg.minutes >= 1440) {
      rows = await fetchDailyMerged(symbol, period1, period2);
      rows = filterDailyWeekdays(rows);
      rows = rows.map((r) => ({
        ...r,
        date: istWallTimeToUTCDate(istDayKey(r.date), SESSION_END_MIN),
      }));
    } else {
      rows = await fetchIntradayMerged(symbol, period1, period2, cfg.yahoo);
      rows = filterIntradaySession(rows);

      if (cfg.minutes > 1 && rows.length === 0) {
        const fine = await fetchIntradayMerged(symbol, period1, period2, '1m');
        rows = resampleIntraday(filterIntradaySession(fine), cfg.minutes);
      }
    }

    const isDaily = cfg.minutes >= 1440;
    let candles = rows.map((r) => toOutputCandle(r, isDaily));

    candles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const seen = new Set();
    candles = candles.filter((c) => {
      if (seen.has(c.timestamp)) return false;
      seen.add(c.timestamp);
      return true;
    });

    if (!candles.length) {
      console.warn(
        `[dataProvider] No candles for ${symbol} ${startDate}→${endDate} ${tf} (session-filtered)`
      );
    }

    writeDiskCache(key, { candles, symbol, startDate, endDate, timeframe: tf });
    touchMemoryCache(key, candles);

    return candles;
  } catch (error) {
    console.error(`[dataProvider] Yahoo Finance error for ${symbol}:`, error);
    throw new Error(`Failed to fetch OHLC data: ${error.message}`);
  }
}

module.exports = {
  getOHLCData,
  formatTimestampIST,
  isWithinNSEIntradaySessionIST,
  INSTRUMENT_MAP,
};
