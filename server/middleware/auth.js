const { requireAuth, getAuth } = require('@clerk/express');

// Blocks unauthenticated requests before they reach controllers.
const protect = requireAuth();

module.exports = { protect, getAuth };
