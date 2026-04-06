const { getAuth } = require('@clerk/express');

// API-friendly auth guard that returns JSON instead of redirecting.
const protect = (req, res, next) => {
	try {
		const auth = getAuth(req);

		if (!auth || !auth.userId) {
			return res.status(401).json({ success: false, error: 'Unauthorized' });
		}

		// Attach auth to request so controllers can access it
		req.auth = auth;

		next();
	} catch (error) {
		console.error('Auth middleware error:', error);
		return res.status(401).json({ success: false, error: 'Authorization failed' });
	}
};

module.exports = { protect, getAuth };
