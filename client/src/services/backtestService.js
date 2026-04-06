import api from './api';

/**
 * Run a backtest for a strategy
 * @param {string} strategyId - ID of the strategy to backtest
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} instrument - Trading instrument (e.g., NIFTY, BANKNIFTY)
 * @param {string} timeframe - Candle timeframe (default: 1min)
 * @returns {Promise<Object>} - Backtest results
 */
export const runBacktest = async (
  strategyId,
  startDate,
  endDate,
  instrument,
  timeframe = '1min'
) => {
  try {
    const response = await api.post('/backtest', {
      strategyId,
      startDate,
      endDate,
      instrument,
      timeframe,
    });

    return response.data;
  } catch (error) {
    console.error('Error running backtest:', error);
    throw error;
  }
};

/**
 * Get all backtests for the authenticated user
 * @returns {Promise<Object>} - List of backtests
 */
export const getBacktests = async () => {
  try {
    const response = await api.get('/backtest');
    return response.data;
  } catch (error) {
    console.error('Error fetching backtests:', error);
    throw error;
  }
};

/**
 * Get a specific backtest by ID
 * @param {string} id - Backtest ID
 * @returns {Promise<Object>} - Backtest details
 */
export const getBacktestById = async (id) => {
  try {
    const response = await api.get(`/backtest/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching backtest:', error);
    throw error;
  }
};
