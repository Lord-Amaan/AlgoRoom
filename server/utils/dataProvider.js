/**
 * Data Provider Utility
 * Fetches OHLC data for backtesting
 * Currently uses mock data - can be replaced with real API later
 */

/**
 * Generate mock OHLC data for testing
 * Uses realistic patterns with some randomness
 */
function generateMockOHLC(startDate, endDate, basePrice = 24500) {
  const candles = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);
  let price = basePrice;

  while (currentDate <= endDateObj) {
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Generate candles for trading hours (09:16 - 15:30)
    for (let hour = 9; hour <= 15; hour++) {
      for (let minute = 0; minute < 60; minute++) {
        // Skip before 09:16 and after 15:30
        if ((hour === 9 && minute < 16) || (hour > 15 && minute > 30)) {
          continue;
        }

        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, minute, 0, 0);

        // Random price movement: ±0.5% per candle
        const volatility = 0.005;
        const movement = (Math.random() - 0.5) * 2 * volatility * price;
        
        const open = price;
        const close = price + movement;
        const high = Math.max(open, close) * (1 + Math.random() * 0.002);
        const low = Math.min(open, close) * (1 - Math.random() * 0.002);

        candles.push({
          timestamp: timestamp.toISOString().replace('T', ' ').slice(0, 19),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });

        price = close;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return candles;
}

/**
 * Fetch OHLC data
 * Currently returns mock data
 * TODO: Replace with real yfinance or broker API
 */
async function getOHLCData(instrument, startDate, endDate, timeframe = '1min') {
  try {
    // For now, return mock data
    // In future, integrate with:
    // - yfinance for NSE data
    // - Zerodha Kite API
    // - Angel Broking API
    
    const basePrice = instrument === 'NIFTY' ? 24500 : 54000; // BANKNIFTY around 54k
    return generateMockOHLC(startDate, endDate, basePrice);
  } catch (error) {
    console.error(`Error fetching OHLC data for ${instrument}:`, error);
    throw new Error(`Failed to fetch OHLC data: ${error.message}`);
  }
}

module.exports = {
  getOHLCData,
  generateMockOHLC,
};
