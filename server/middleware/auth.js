const { requireAuth, getAuth } = require('@clerk/express');

const protect = requireAuth();

module.exports = { protect, getAuth };
