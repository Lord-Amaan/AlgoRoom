const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const STOCK_UNIVERSE = [
  { symbol: 'NIFTY', name: 'NIFTY 50', exchange: 'NSE', kind: 'INDEX', base: 24620 },
  { symbol: 'SENSEX', name: 'S&P BSE SENSEX', exchange: 'BSE', kind: 'INDEX', base: 81040 },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', exchange: 'NSE', kind: 'INDEX', base: 23540 },
  { symbol: 'BANKNIFTY', name: 'NIFTY BANK', exchange: 'NSE', kind: 'INDEX', base: 53400 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', kind: 'EQUITY', base: 2920 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', kind: 'EQUITY', base: 4010 },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', kind: 'EQUITY', base: 1650 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', kind: 'EQUITY', base: 1700 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', kind: 'EQUITY', base: 1210 },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', kind: 'EQUITY', base: 845 },
  { symbol: 'LT', name: 'Larsen & Toubro', exchange: 'NSE', kind: 'EQUITY', base: 3820 },
  { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', kind: 'EQUITY', base: 452 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', kind: 'EQUITY', base: 2680 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE', kind: 'EQUITY', base: 1780 },
  { symbol: 'AXISBANK', name: 'Axis Bank', exchange: 'NSE', kind: 'EQUITY', base: 1200 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', exchange: 'NSE', kind: 'EQUITY', base: 7160 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', exchange: 'NSE', kind: 'EQUITY', base: 1640 },
  { symbol: 'WIPRO', name: 'Wipro', exchange: 'NSE', kind: 'EQUITY', base: 520 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', exchange: 'NSE', kind: 'EQUITY', base: 12310 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', exchange: 'NSE', kind: 'EQUITY', base: 1030 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', exchange: 'NSE', kind: 'EQUITY', base: 2720 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', exchange: 'NSE', kind: 'EQUITY', base: 1670 },
  { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories', exchange: 'NSE', kind: 'EQUITY', base: 6660 },
  { symbol: 'CIPLA', name: 'Cipla', exchange: 'NSE', kind: 'EQUITY', base: 1510 },
  { symbol: 'NTPC', name: 'NTPC', exchange: 'NSE', kind: 'EQUITY', base: 420 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', exchange: 'NSE', kind: 'EQUITY', base: 325 },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corp', exchange: 'NSE', kind: 'EQUITY', base: 295 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', exchange: 'NSE', kind: 'EQUITY', base: 1490 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', exchange: 'NSE', kind: 'EQUITY', base: 3030 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', exchange: 'NSE', kind: 'EQUITY', base: 11640 },
  { symbol: 'TITAN', name: 'Titan Company', exchange: 'NSE', kind: 'EQUITY', base: 3820 },
  { symbol: 'NESTLEIND', name: 'Nestle India', exchange: 'NSE', kind: 'EQUITY', base: 2520 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', exchange: 'NSE', kind: 'EQUITY', base: 1790 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', exchange: 'NSE', kind: 'EQUITY', base: 3280 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', exchange: 'NSE', kind: 'EQUITY', base: 1450 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', exchange: 'NSE', kind: 'EQUITY', base: 955 },
  { symbol: 'TATASTEEL', name: 'Tata Steel', exchange: 'NSE', kind: 'EQUITY', base: 168 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', exchange: 'NSE', kind: 'EQUITY', base: 700 },
  { symbol: 'COALINDIA', name: 'Coal India', exchange: 'NSE', kind: 'EQUITY', base: 480 },
  { symbol: 'BPCL', name: 'Bharat Petroleum', exchange: 'NSE', kind: 'EQUITY', base: 605 },
  { symbol: 'IOC', name: 'Indian Oil Corporation', exchange: 'NSE', kind: 'EQUITY', base: 180 },
  { symbol: 'GRASIM', name: 'Grasim Industries', exchange: 'NSE', kind: 'EQUITY', base: 2840 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', exchange: 'NSE', kind: 'EQUITY', base: 5420 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', exchange: 'NSE', kind: 'EQUITY', base: 1480 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', exchange: 'NSE', kind: 'EQUITY', base: 5140 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', exchange: 'NSE', kind: 'EQUITY', base: 6870 },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories', exchange: 'NSE', kind: 'EQUITY', base: 4680 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', exchange: 'NSE', kind: 'EQUITY', base: 5480 },
  { symbol: 'TECHM', name: 'Tech Mahindra', exchange: 'NSE', kind: 'EQUITY', base: 1465 },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance', exchange: 'NSE', kind: 'EQUITY', base: 2850 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', exchange: 'NSE', kind: 'EQUITY', base: 685 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', exchange: 'NSE', kind: 'EQUITY', base: 1770 },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', exchange: 'NSE', kind: 'EQUITY', base: 3120 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', exchange: 'NSE', kind: 'EQUITY', base: 9700 },
  { symbol: 'DLF', name: 'DLF', exchange: 'NSE', kind: 'EQUITY', base: 915 },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products', exchange: 'NSE', kind: 'EQUITY', base: 1320 },
  { symbol: 'SIEMENS', name: 'Siemens', exchange: 'NSE', kind: 'EQUITY', base: 7210 },
  { symbol: 'TRENT', name: 'Trent', exchange: 'NSE', kind: 'EQUITY', base: 5410 },
  { symbol: 'ZOMATO', name: 'Zomato', exchange: 'NSE', kind: 'EQUITY', base: 232 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures', exchange: 'NSE', kind: 'EQUITY', base: 201 },
  { symbol: 'PAYTM', name: 'One 97 Communications', exchange: 'NSE', kind: 'EQUITY', base: 456 },
];

const RANGE_POINTS = {
  '1D': 78,
  '1W': 35,
  '1M': 48,
  '3M': 60,
  '1Y': 52,
};

const DETAIL_CACHE_TTL_MS = 900;
const detailCache = new Map();

function hashString(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function makeRng(seed) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRangeSeries(base, range, symbol) {
  const points = RANGE_POINTS[range] || RANGE_POINTS['1D'];
  const rng = makeRng(hashString(`${symbol}:${range}`));
  const volatility = range === '1D' ? 0.0025 : range === '1W' ? 0.007 : range === '1M' ? 0.015 : range === '3M' ? 0.03 : 0.08;
  const drift = (rng() - 0.45) * volatility;

  let current = base * (0.96 + rng() * 0.08);
  const values = [];
  for (let i = 0; i < points; i += 1) {
    const noise = (rng() - 0.5) * volatility;
    current = Math.max(1, current * (1 + drift / points + noise));
    values.push(Number(current.toFixed(2)));
  }

  return values;
}

function getStockDetail(stock) {
  const cacheKey = stock.symbol;
  const existing = detailCache.get(cacheKey);
  if (existing && Date.now() - existing.timestamp < DETAIL_CACHE_TTL_MS) {
    return existing.data;
  }

  const charts = {};
  Object.keys(RANGE_POINTS).forEach((range) => {
    charts[range] = buildRangeSeries(stock.base, range, stock.symbol);
  });

  const timeFactor = Date.now() / 1000;
  const livePulse = Math.sin(timeFactor + (hashString(stock.symbol) % 31)) * (stock.base * 0.00055);

  if (charts['1D']?.length) {
    const i = charts['1D'].length - 1;
    charts['1D'][i] = Number(Math.max(1, charts['1D'][i] + livePulse).toFixed(2));
  }

  const daySeries = charts['1D'];
  const current = daySeries[daySeries.length - 1] || stock.base;
  const previousClose = daySeries[Math.max(0, daySeries.length - 2)] || stock.base;
  const change = current - previousClose;
  const changePct = (change / Math.max(1, previousClose)) * 100;

  const data = {
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange,
    kind: stock.kind,
    price: Number(current.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    open: Number(daySeries[0].toFixed(2)),
    high: Number(Math.max(...daySeries).toFixed(2)),
    low: Number(Math.min(...daySeries).toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
    volume: Math.round((hashString(stock.symbol) % 9000000) + 500000),
    marketCapCr: Math.round((hashString(stock.symbol + 'cap') % 3000000) + 45000),
    peRatio: Number((((hashString(stock.symbol + 'pe') % 3000) / 100) + 8).toFixed(2)),
    charts,
    updatedAt: new Date().toISOString(),
  };

  detailCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
}

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const limitRaw = Number(req.query.limit || 24);
  const cursorRaw = Number(req.query.cursor || 0);
  const limit = Math.min(50, Math.max(10, Number.isFinite(limitRaw) ? limitRaw : 24));
  const cursor = Math.max(0, Number.isFinite(cursorRaw) ? cursorRaw : 0);

  const filtered = q
    ? STOCK_UNIVERSE.filter((stock) => stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q))
    : STOCK_UNIVERSE;

  const page = filtered.slice(cursor, cursor + limit);
  const items = page.map((stock) => {
    const detail = getStockDetail(stock);
    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      kind: stock.kind,
      price: detail.price,
      change: detail.change,
      changePct: detail.changePct,
    };
  });

  const nextCursor = cursor + limit < filtered.length ? cursor + limit : null;

  return res.status(200).json({
    success: true,
    data: {
      items,
      nextCursor,
      total: filtered.length,
    },
  });
});

router.get('/:symbol', (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  const stock = STOCK_UNIVERSE.find((item) => item.symbol.toUpperCase() === symbol);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Symbol not found' });
  }

  const detail = getStockDetail(stock);
  return res.status(200).json({ success: true, data: detail });
});

module.exports = router;
