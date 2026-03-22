const express = require('express');
const router = express.Router();
const {
  getTrades,
  getPositions,
  deployStrategy,
  stopStrategy,
} = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTrades);
router.get('/positions', getPositions);
router.post('/deploy/:strategyId', deployStrategy);
router.post('/stop/:strategyId', stopStrategy);

module.exports = router;
