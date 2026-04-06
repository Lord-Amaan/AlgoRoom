const Strategy = require('../models/Strategy')

exports.getStrategies = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategies = await Strategy.find({ userId });
    res.status(200).json({ success: true, data: strategies });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStrategy = async (req, res) => {
  try {
    const userId = req.auth?.userId;
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
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategy = await Strategy.create({
      ...req.body, // all form data from frontend
      userId,      // attach clerk id
    });

    res.status(201).json({ success: true, data: strategy });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStrategy = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({ success: false, error: "Strategy not found" });
    }

    if (strategy.userId !== userId) {
      return res.status(403).json({ success: false, error: "Not your strategy" });
    }

    const updated = await Strategy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // ← returns updated doc, not old one
    );

    res.status(200).json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteStrategy = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({ success: false, error: "Strategy not found" });
    }

    if (strategy.userId !== userId) {
      return res.status(403).json({ success: false, error: "Not your strategy" });
    }

    await strategy.deleteOne();
    res.status(200).json({ success: true, message: "Strategy deleted!" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};