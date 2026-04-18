const { upsertUser } = require('../services/userService')
const { getRequestAuth } = require('../middleware/auth')
exports.getMe = async (req, res) => {
  try {
    const { userId } = getRequestAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await upsertUser(userId);
    res.status(200).json({ userId, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
