const Strategy = require('../models/Strategy');
const Backtest = require('../models/Backtest');
const { getOHLCData } = require('../utils/dataProvider');

/**
 * POST /api/backtest
 * Run a backtest for a strategy
 */
exports.runBacktest = async (req, res) => {
  try {
    const userId = req.auth.userId; // From Clerk auth
    const { strategyId, instrument, startDate, endDate, timeframe = '1min' } = req.body;

    // ===== VALIDATION =====
    if (!strategyId || !instrument || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: strategyId, instrument, startDate, endDate',
      });
    }

    // ===== DATE VALIDATION =====
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for fair comparison

    // Parse as local dates (YYYY-MM-DD format)
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    
    const startLocal = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    const endLocal = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

    // Validate date format
    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD format.',
      });
    }

    // Validate date range
    if (startLocal > endLocal) {
      return res.status(400).json({
        success: false,
        error: 'startDate cannot be after endDate',
      });
    }

    // Prevent backtesting with future dates
    if (endLocal > today) {
      return res.status(400).json({
        success: false,
        error: `endDate cannot be in the future. Today is ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      });
    }

    if (startLocal > today) {
      return res.status(400).json({
        success: false,
        error: `startDate cannot be in the future. Today is ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      });
    }

    // ===== FETCH STRATEGY FROM DB =====
    // Important: Query by both ID and userId to prevent race conditions
    const strategy = await Strategy.findOne({
      _id: strategyId,
      userId: userId
    });
    
    if (!strategy) {
      return res.status(403).json({
        success: false,
        error: 'Strategy not found or does not belong to you',
      });
    }

    // Validate strategy has legs
    if (!strategy.legs || strategy.legs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Strategy must have at least one leg configured',
      });
    }

    // ===== FETCH OHLC DATA =====
    console.log(`Fetching OHLC data for ${instrument} from ${startDate} to ${endDate}`);
    const candles = await getOHLCData(instrument, startDate, endDate, timeframe);

    if (!candles || candles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No OHLC data available for the given date range',
      });
    }

    console.log(`Received ${candles.length} candles. Sending to Python engine...`);

    // ===== CALL PYTHON ENGINE =====
    const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';
    const backTestRequest = {
      candles,
      strategy: {
        strategyType: strategy.strategyType,
        instruments: strategy.instruments,
        legs: strategy.legs,
        orderConfig: strategy.orderConfig,
        riskManagement: strategy.riskManagement,
        advanceFeatures: strategy.advanceFeatures,
      },
    };

    console.log('Calling Python engine at:', `${pythonEngineUrl}/backtest`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let pythonResponse;
    try {
      pythonResponse = await fetch(`${pythonEngineUrl}/backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backTestRequest),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Python engine timed out (30s). Please try again.',
        });
      }
      return res.status(503).json({
        success: false,
        error: `Python engine connection failed: ${fetchErr.message}`,
      });
    }
    
    clearTimeout(timeoutId);

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error('Python engine error:', errorData);
      return res.status(503).json({
        success: false,
        error: `Python engine error: ${pythonResponse.status}`,
        details: errorData,
      });
    }

    let backTestResults;
    try {
      backTestResults = await pythonResponse.json();
    } catch (jsonErr) {
      return res.status(503).json({
        success: false,
        error: 'Python engine returned invalid JSON',
        details: jsonErr.message,
      });
    }
    console.log('Backtest results received:', {
      pnl: backTestResults.pnl,
      totalTrades: backTestResults.total_trades,
      winRate: backTestResults.win_rate,
    });

    // ===== SAVE BACKTEST TO DB =====
    const backtest = new Backtest({
      user: userId,
      strategy: strategyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instrument,
      timeframe,
      status: 'completed',
      totalPnl: backTestResults.pnl || 0,
      totalTrades: backTestResults.total_trades || 0,
      winRate: backTestResults.win_rate || 0,
      maxDrawdown: backTestResults.max_drawdown || 0,
      trades: (backTestResults.trades || []).map((trade, idx) => ({
        legIndex: trade.legIndex || 0,
        entryPrice: trade.entry_price || 0,
        exitPrice: trade.exit_price || 0,
        entryTime: trade.entry_time ? new Date(trade.entry_time) : null,
        exitTime: trade.exit_time ? new Date(trade.exit_time) : null,
        pnl: trade.profit || trade.pnl || 0,
        status: 'closed',
      })),
      rawResults: backTestResults,
    });

    await backtest.save();
    console.log('Backtest saved to DB:', backtest._id);

    // ===== RETURN RESPONSE =====
    return res.status(200).json({
      success: true,
      data: {
        backtestId: backtest._id,
        pnl: backtest.totalPnl,
        totalTrades: backtest.totalTrades,
        winRate: backtest.winRate,
        maxDrawdown: backtest.maxDrawdown,
        trades: backtest.trades,
        createdAt: backtest.createdAt,
      },
    });
  } catch (error) {
    console.error('Backtest error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
};

/**
 * GET /api/backtest
 * Get all backtests for the authenticated user
 */
exports.getBacktests = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const backtests = await Backtest.find({ user: userId })
      .populate('strategy', 'name strategyType')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: backtests.map((bt) => ({
        id: bt._id,
        strategyName: bt.strategy?.name || 'Unknown Strategy',
        strategyType: bt.strategy?.strategyType || 'N/A',
        instrument: bt.instrument,
        dateRange: {
          start: bt.startDate,
          end: bt.endDate,
        },
        results: {
          pnl: bt.totalPnl,
          totalTrades: bt.totalTrades,
          winRate: bt.winRate,
          maxDrawdown: bt.maxDrawdown,
        },
        status: bt.status,
        createdAt: bt.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get backtests error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch backtests',
      details: error.message,
    });
  }
};

/**
 * GET /api/backtest/:id
 * Get specific backtest details
 */
exports.getBacktest = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const backtest = await Backtest.findById(id).populate('strategy');

    if (!backtest) {
      return res.status(404).json({
        success: false,
        error: 'Backtest not found',
      });
    }

    // Verify ownership
    if (backtest.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Backtest does not belong to this user',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: backtest._id,
        strategy: {
          id: backtest.strategy._id,
          name: backtest.strategy.name,
          type: backtest.strategy.strategyType,
        },
        instrument: backtest.instrument,
        dateRange: {
          start: backtest.startDate,
          end: backtest.endDate,
        },
        results: {
          pnl: backtest.totalPnl,
          totalTrades: backtest.totalTrades,
          winRate: backtest.winRate,
          maxDrawdown: backtest.maxDrawdown,
          maxProfit: backtest.maxProfit,
        },
        trades: backtest.trades,
        status: backtest.status,
        createdAt: backtest.createdAt,
      },
    });
  } catch (error) {
    console.error('Get backtest error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch backtest',
      details: error.message,
    });
  }
};
