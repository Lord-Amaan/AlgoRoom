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

    // ===== FETCH STRATEGY FROM DB =====
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Verify strategy belongs to user
    if (!strategy.userId) {
      return res.status(400).json({
        success: false,
        error: 'Strategy is missing userId. Please recreate the strategy.',
      });
    }

    const strategyUserIdStr = String(strategy.userId).trim();
    const currentUserIdStr = String(userId).trim();

    if (strategyUserIdStr !== currentUserIdStr) {
      console.log('Access denied:', { strategyUserId: strategyUserIdStr, currentUserId: currentUserIdStr });
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Strategy does not belong to this user',
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
    const pythonResponse = await fetch(`${pythonEngineUrl}/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backTestRequest),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text();
      console.error('Python engine error:', errorData);
      return res.status(503).json({
        success: false,
        error: `Python engine error: ${pythonResponse.status}`,
        details: errorData,
      });
    }

    const backTestResults = await pythonResponse.json();
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
