const { getAuth } = require('@clerk/express');
const {upsertUser} = require('../services/userService')
exports.getMe = async (req, res) => {
  try {
    // Read the user id from the verified Clerk token in this request.
    const { userId } = getAuth(req);

    const user = await upsertUser(userId);
    res.status(200).json({ userId, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
