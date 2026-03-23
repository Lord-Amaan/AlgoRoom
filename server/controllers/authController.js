const { getAuth } = require('@clerk/express');

exports.getMe = async (req, res) => {
  const { userId } = getAuth(req);
  res.status(200).json({ userId });
};
