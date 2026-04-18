function getRequestAuth(req) {
	const auth = req?.auth;

	if (typeof auth === 'function') {
		try {
			return auth() || {};
		} catch (error) {
			return {};
		}
	}

	if (auth && typeof auth === 'object') {
		return auth;
	}

	return {};
}

// API-friendly auth guard that returns JSON instead of redirecting.
const protect = (req, res, next) => {
	try {
		const auth = getRequestAuth(req);

		if (!auth || !auth.userId) {
			return res.status(401).json({ success: false, error: 'Unauthorized' });
		}

		// Attach normalized auth to request so controllers can access it.
		req.auth = auth;

		next();
	} catch (error) {
		console.error('Auth middleware error:', error);
		return res.status(401).json({ success: false, error: 'Authorization failed' });
	}
};

module.exports = { protect, getRequestAuth };
