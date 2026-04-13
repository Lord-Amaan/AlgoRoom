<<<<<<< Updated upstream
export default function Backtesting() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Backtesting</h1>
      <p className="text-dark-400">Run strategies against historical data and analyze results.</p>
=======
import { useState, useEffect, useCallback } from 'react';
import { runBacktest, getBacktests, getBacktestById } from '../services/backtestService';
import { strategyService } from '../services/strategyService';
import BacktestResults from '../components/BacktestResults';
import EquityCurve from '../components/EquityCurve';
import DailyPnlChart from '../components/DailyPnlChart';
import CalendarHeatmap from '../components/CalendarHeatmap';
import AdvancedMetricsPanel from '../components/AdvancedMetricsPanel';
import PositionCard from '../components/PositionCard';
import { SkeletonBacktestForm, SkeletonBacktestResults } from '../components/Skeleton';

export default function Backtesting() {
  const [strategies, setStrategies] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
  };

  const [formData, setFormData] = useState({
    strategyId: '',
    instrument: 'NIFTY',
    startDate: '',
    endDate: '',
    timeframe: '1min',
  });

  const refreshBacktestsList = useCallback(async () => {
    try {
      const backtestsResponse = await getBacktests();
      const backtestsList = Array.isArray(backtestsResponse.data)
        ? backtestsResponse.data
        : backtestsResponse.data?.data || [];
      setBacktests(backtestsList);
    } catch (e) {
      console.error('Failed to refresh backtests', e);
    }
  }, []);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await strategyService.getAll();
        const strategiesList = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setStrategies(strategiesList);
      } catch (err) {
        console.error('Failed to fetch strategies:', err);
        setStrategies([]);
      }
    };

    fetchStrategies();
    refreshBacktestsList();
  }, [refreshBacktestsList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startDate' || name === 'endDate') {
      const selectedDate = parseLocalDate(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        setError('Cannot select future dates for backtesting');
        return;
      }

      if (name === 'endDate' && formData.startDate) {
        const startDate = parseLocalDate(formData.startDate);
        if (selectedDate < startDate) {
          setError('End date cannot be before start date');
          return;
        }
      }

      if (name === 'startDate' && formData.endDate) {
        const endDate = parseLocalDate(formData.endDate);
        if (selectedDate > endDate) {
          setError('Start date cannot be after end date');
          return;
        }
      }

      setError(null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRunBacktest = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.strategyId || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    const startDate = parseLocalDate(formData.startDate);
    const endDate = parseLocalDate(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }

    if (endDate > today || startDate > today) {
      setError('Cannot backtest with future dates');
      return;
    }

    setLoading(true);

    try {
      const result = await runBacktest(
        formData.strategyId,
        formData.startDate,
        formData.endDate,
        formData.instrument,
        formData.timeframe
      );

      if (result.success && result.data) {
        setSelectedResult(result.data);
        await refreshBacktestsList();
      } else {
        setError(result.error || 'Backtest failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error running backtest';
      setError(errorMsg);
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPastBacktest = async (listItem) => {
    if (!listItem?.id) return;
    setError(null);
    setDetailLoading(true);
    try {
      const res = await getBacktestById(listItem.id);
      if (res.success && res.data) {
        setSelectedResult(res.data);
      } else {
        setError(res.error || 'Failed to load backtest');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load backtest');
    } finally {
      setDetailLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedResult(null);
    setError(null);
  };

  const summary = selectedResult?.summary;
  const equityCurve = selectedResult?.equity_curve ?? [];
  const dailyPnl = selectedResult?.daily_pnl ?? [];
  const calendar = selectedResult?.calendar ?? {};
  const advancedMetrics = selectedResult?.advanced_metrics ?? {};
  const trades = selectedResult?.trades ?? [];

  const strategyLabel = selectedResult?.strategy
    ? `${selectedResult.strategy.name} (${selectedResult.strategy.type})`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Backtesting</h1>
        <p className="text-dark-400">
          Run strategies against historical data and analyze results.
        </p>
      </div>

      {loading ? (
        <SkeletonBacktestForm />
      ) : (
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
          <h2 className="text-xl font-semibold mb-4">New Backtest</h2>

          <form onSubmit={handleRunBacktest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Strategy *</label>
                <select
                  name="strategyId"
                  value={formData.strategyId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select a strategy</option>
                  {(strategies || []).map((strategy) => (
                    <option key={strategy._id} value={strategy._id}>
                      {strategy.name} ({strategy.strategyType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Instrument</label>
                <select
                  name="instrument"
                  value={formData.instrument}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="NIFTY">NIFTY</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                  <option value="FINNIFTY">FINNIFTY</option>
                  <option value="GOLDBEES">GOLDBEES</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  max={getTodayDate()}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  max={getTodayDate()}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Timeframe</label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="1min">1 Minute</option>
                  <option value="5min">5 Minutes</option>
                  <option value="15min">15 Minutes</option>
                  <option value="1hour">1 Hour</option>
                  <option value="1day">1 Day</option>
                </select>
              </div>
            </div>

            {error && !selectedResult && (
              <div className="p-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {loading ? 'Running Backtest...' : 'Run Backtest'}
            </button>
          </form>
        </div>
      )}

      {selectedResult && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-4 py-2 text-sm bg-dark-700 border border-dark-600 rounded-lg text-white hover:border-blue-500 transition"
            >
              ← Back to list
            </button>
            {detailLoading && (
              <span className="text-sm text-dark-400">Loading backtest…</span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {detailLoading ? (
            <SkeletonBacktestResults />
          ) : (
            <div className="space-y-6">
              <BacktestResults
                summary={summary}
                createdAt={selectedResult.createdAt}
                strategyLabel={strategyLabel}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EquityCurve equityCurve={equityCurve} summary={summary} />
                <DailyPnlChart dailyPnl={dailyPnl} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CalendarHeatmap calendar={calendar} />
                <AdvancedMetricsPanel advancedMetrics={advancedMetrics} />
              </div>

              <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
                <h3 className="text-lg font-semibold mb-4">Trades ({trades.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {trades.length > 0 ? (
                    trades.map((trade, idx) => (
                      <PositionCard key={trade.id ?? idx} trade={trade} index={idx + 1} />
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No trades executed.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {backtests.length > 0 && !selectedResult && (
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
          <h3 className="text-lg font-semibold mb-4">Past Backtests</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backtests.map((backtest) => {
              const pnl = backtest.results?.total_pnl ?? 0;
              const nTrades = backtest.results?.total_trades ?? 0;
              return (
                <div
                  key={backtest.id}
                  onClick={() => openPastBacktest(backtest)}
                  onKeyDown={(e) => e.key === 'Enter' && openPastBacktest(backtest)}
                  role="button"
                  tabIndex={0}
                  className="p-4 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition border border-dark-600 hover:border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{backtest.strategyName}</p>
                      <p className="text-sm text-dark-400">
                        {backtest.instrument} • {new Date(backtest.dateRange.start).toLocaleDateString()}{' '}
                        to {new Date(backtest.dateRange.end).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {pnl > 0 ? '+' : ''}
                        {Number(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-dark-400">{nTrades} trades</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
