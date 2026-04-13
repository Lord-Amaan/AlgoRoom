const {upsertUser} = require('../services/userService')
exports.getMe = async (req, res) => {
  try {
    // Get userId from req.auth (set by protect middleware)
    const userId = req.auth?.userId;

    const user = await upsertUser(userId);
    res.status(200).json({ userId, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
