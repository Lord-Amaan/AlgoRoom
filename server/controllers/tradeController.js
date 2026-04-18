const Strategy = require('../models/Strategy');
const Trade = require('../models/Trade');
const Position = require('../models/Position');
const StrategyDeployment = require('../models/StrategyDeployment');
const { getRequestAuth } = require('../middleware/auth');
const paperTradingEngine = require('../services/paperTradingEngine');

exports.getTrades = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { deploymentId } = req.query;

    const tradeFilter = { user: userId, mode: 'PAPER' };
    if (deploymentId) {
      tradeFilter.deployment = deploymentId;
    }

    const deploymentFilter = { userId, mode: 'PAPER' };
    if (deploymentId) {
      deploymentFilter._id = deploymentId;
    }

    const [trades, deployments] = await Promise.all([
      Trade.find(tradeFilter)
        .populate('strategy', 'name strategyType')
        .sort({ createdAt: -1 })
        .limit(200),
      StrategyDeployment.find(deploymentFilter)
        .populate('strategy', 'name strategyType')
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        trades,
        deployments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPositions = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { deploymentId } = req.query;

    const positionFilter = { user: userId, mode: 'PAPER', isActive: true };
    if (deploymentId) {
      positionFilter.deployment = deploymentId;
    }

    const positions = await Position.find(positionFilter)
      .populate('strategy', 'name strategyType')
      .sort({ createdAt: -1 });

    const totalUnrealizedPnl = positions.reduce((sum, item) => sum + Number(item.unrealizedPnl || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        positions,
        summary: {
          activeCount: positions.length,
          totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deployStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { strategyId } = req.params;
    const {
      mode = 'PAPER',
      instrument,
      timeframe = '1min',
      capital = 100000,
      maxDailyLoss = 2000,
      pollIntervalSec = 20,
    } = req.body || {};

    if (mode !== 'PAPER') {
      return res.status(400).json({
        success: false,
        error: 'Only PAPER mode is available right now',
      });
    }

    const strategy = await Strategy.findOne({ _id: strategyId, userId });
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found or does not belong to you',
      });
    }

    const activeLegs = (strategy.legs || []).filter((leg) => leg?.isActive !== false);
    if (!activeLegs.length) {
      return res.status(400).json({
        success: false,
        error: 'Strategy has no active legs to deploy',
      });
    }

    const existing = await StrategyDeployment.findOne({
      userId,
      strategy: strategy._id,
      mode: 'PAPER',
      status: { $in: ['STARTING', 'RUNNING'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'This strategy is already running in paper mode',
      });
    }

    const deployment = await StrategyDeployment.create({
      userId,
      strategy: strategy._id,
      mode: 'PAPER',
      status: 'STARTING',
      instrument: instrument || strategy?.instruments?.[0] || 'NIFTY',
      timeframe,
      capital: Number(capital || 100000),
      maxDailyLoss: Number(maxDailyLoss || 2000),
      pollIntervalSec: Number(pollIntervalSec || 20),
    });

    await Strategy.findByIdAndUpdate(strategy._id, { isActive: true });

    try {
      await paperTradingEngine.startDeployment(deployment._id);
      const hydrated = await StrategyDeployment.findById(deployment._id).populate('strategy', 'name strategyType');
      return res.status(200).json({
        success: true,
        data: hydrated,
      });
    } catch (engineError) {
      await StrategyDeployment.findByIdAndUpdate(deployment._id, {
        status: 'ERROR',
        lastError: engineError.message,
        lastHeartbeatAt: new Date(),
      });
      await Strategy.findByIdAndUpdate(strategy._id, { isActive: false });

      return res.status(500).json({
        success: false,
        error: `Failed to start paper deployment: ${engineError.message}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.stopStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { strategyId } = req.params;
    const deployment = await StrategyDeployment.findOne({
      userId,
      strategy: strategyId,
      mode: 'PAPER',
      status: { $in: ['STARTING', 'RUNNING', 'STOPPING'] },
    }).sort({ createdAt: -1 });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'No running paper deployment found for this strategy',
      });
    }

    const stopped = await paperTradingEngine.stopDeployment(deployment._id, 'MANUAL_STOP');

    return res.status(200).json({
      success: true,
      data: stopped,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
