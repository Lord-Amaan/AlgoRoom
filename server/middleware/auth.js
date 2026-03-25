const { getAuth } = require('@clerk/express');

// API-friendly auth guard that returns JSON instead of redirecting.
const protect = (req, res, next) => {
	const { userId } = getAuth(req);

	if (!userId) {
		return res.status(401).json({ success: false, error: 'Unauthorized' });
	}

	next();
};

module.exports = { protect, getAuth };
