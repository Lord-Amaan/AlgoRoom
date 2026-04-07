import { useState, useEffect } from 'react';
import { runBacktest, getBacktests } from '../services/backtestService';
import { strategyService } from '../services/strategyService';
import BacktestResults from '../components/BacktestResults';
import EquityCurve from '../components/EquityCurve';
import PositionCard from '../components/PositionCard';
import { SkeletonBacktestForm, SkeletonBacktestResults } from '../components/Skeleton';

export default function Backtesting() {
  const [strategies, setStrategies] = useState([]);
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  // Get today's date in YYYY-MM-DD format (LOCAL timezone, not UTC)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse date string (YYYY-MM-DD) as local date, not UTC
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
  };

  // Form state
  const [formData, setFormData] = useState({
    strategyId: '',
    instrument: 'NIFTY',
    startDate: '',
    endDate: '',
    timeframe: '1min',
  });

  // Fetch strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await strategyService.getAll();
        // API returns { data: [...] } so we need response.data.data
        const strategiesList = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setStrategies(strategiesList);
      } catch (err) {
        console.error('Failed to fetch strategies:', err);
        setStrategies([]);
      }
    };

    fetchStrategies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Date validation for start and end dates
    if (name === 'startDate' || name === 'endDate') {
      const selectedDate = parseLocalDate(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Prevent future dates
      if (selectedDate > today) {
        setError('Cannot select future dates for backtesting');
        return;
      }
      
      // If endDate, ensure it's not before startDate
      if (name === 'endDate' && formData.startDate) {
        const startDate = parseLocalDate(formData.startDate);
        if (selectedDate < startDate) {
          setError('End date cannot be before start date');
          return;
        }
      }
      
      // If startDate, ensure it's not after endDate
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

    // Validate form
    if (!formData.strategyId || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Final date validation before submission
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

      if (result.success) {
        setSelectedResult(result.data);
        // Refresh backtests list
        const backtestsResponse = await getBacktests();
        const backtestsList = Array.isArray(backtestsResponse.data) 
          ? backtestsResponse.data 
          : backtestsResponse.data?.data || [];
        setBacktests(backtestsList);
      } else {
        setError(result.error || 'Backtest failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error running backtest';
      setError(errorMsg);
      console.error('Backtest error:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Backtesting</h1>
        <p className="text-dark-400">
          Run strategies against historical data and analyze results.
        </p>
      </div>

      {/* Input Form */}
      {loading ? (
        <SkeletonBacktestForm />
      ) : (
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
          <h2 className="text-xl font-semibold mb-4">New Backtest</h2>

          <form onSubmit={handleRunBacktest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Strategy *
              </label>
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

            {/* Instrument Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Instrument
              </label>
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

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Start Date *
              </label>
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

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                End Date *
              </label>
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

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Timeframe
              </label>
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

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
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

      {/* Results Section */}
      {selectedResult && loading ? (
        <SkeletonBacktestResults />
      ) : selectedResult && (
        <div className="space-y-6">
          {/* Summary Results */}
          <BacktestResults result={selectedResult} />

          {/* Equity Curve Chart */}
          <EquityCurve trades={selectedResult.trades} />

          {/* Individual Trades */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <h3 className="text-lg font-semibold mb-4">Trades ({selectedResult.trades?.length || 0})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedResult.trades && selectedResult.trades.length > 0 ? (
                selectedResult.trades.map((trade, idx) => (
                  <PositionCard key={idx} trade={trade} index={idx + 1} />
                ))
              ) : (
                <p className="text-dark-400 text-sm">No trades executed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Past Backtests */}
      {backtests.length > 0 && !selectedResult && (
        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
          <h3 className="text-lg font-semibold mb-4">Past Backtests</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backtests.map((backtest) => (
              <div
                key={backtest.id}
                onClick={() => setSelectedResult(backtest)}
                className="p-4 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition border border-dark-600 hover:border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">{backtest.strategyName}</p>
                    <p className="text-sm text-dark-400">
                      {backtest.instrument} • {new Date(backtest.dateRange.start).toLocaleDateString()} to{' '}
                      {new Date(backtest.dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${backtest.results.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {backtest.results.pnl > 0 ? '+' : ''}{backtest.results.pnl.toFixed(2)}
                    </p>
                    <p className="text-sm text-dark-400">{backtest.results.totalTrades} trades</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
