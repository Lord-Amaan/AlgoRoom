const Strategy = require('../models/Strategy')
const StrategyTemplate = require('../models/StrategyTemplate')
const { getRequestAuth } = require('../middleware/auth')

exports.getStrategies = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategies = await Strategy.find({ userId });
    res.status(200).json({ success: true, data: strategies });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStrategyTemplates = async (req, res) => {
  try {
    const templates = await StrategyTemplate.find({ isPrebuilt: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategy = await Strategy.findById(req.params.id);

    // check if strategy exists FIRST before comparing userIds
    if (!strategy) {
      return res.status(404).json({ success: false, error: "Strategy not found" });
    }

    //  403 not 400 — forbidden means you don't have permission
    if (strategy.userId !== userId) {
      return res.status(403).json({ success: false, error: "Not your strategy" });
    }

    res.status(200).json({ success: true, data: strategy });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Whitelist allowed fields to prevent injection
    const {
      name,
      strategyType,
      instruments,
      legs,
      orderConfig,
      riskManagement,
      advanceFeatures,
    } = req.body;

    // Validate required fields
    if (!name || !strategyType || !instruments || !legs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, strategyType, instruments, legs',
      });
    }

    const strategy = await Strategy.create({
      userId,
      name,
      strategyType,
      instruments,
      legs,
      orderConfig,
      riskManagement,
      advanceFeatures,
      isActive: false, // New strategies are inactive by default
    });

    res.status(201).json({ success: true, data: strategy });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Strategy with name "${error.keyValue.name}" already exists for your account`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Whitelist fields that can be updated
    const {
      name,
      strategyType,
      instruments,
      legs,
      orderConfig,
      riskManagement,
      advanceFeatures,
      isActive,
    } = req.body;

    // Check authorization and update in single query
    const updated = await Strategy.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: userId, // Ensure user owns this strategy
      },
      {
        ...(name && { name }),
        ...(strategyType && { strategyType }),
        ...(instruments && { instruments }),
        ...(legs && { legs }),
        ...(orderConfig && { orderConfig }),
        ...(riskManagement && { riskManagement }),
        ...(advanceFeatures && { advanceFeatures }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(403).json({
        success: false,
        error: 'Strategy not found or does not belong to you',
      });
    }

    res.status(200).json({ success: true, data: updated });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Strategy with name "${error.keyValue.name}" already exists for your account`,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteStrategy = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Delete only if user owns the strategy
    const deleted = await Strategy.findOneAndDelete({
      _id: req.params.id,
      userId: userId,
    });

    if (!deleted) {
      return res.status(403).json({
        success: false,
        error: 'Strategy not found or does not belong to you',
      });
    }

    res.status(200).json({ success: true, message: "Strategy deleted" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};