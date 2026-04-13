const express = require('express');
const router = express.Router();
const {
  getStrategies,
  getStrategyTemplates,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} = require('../controllers/strategyController');
const { protect } = require('../middleware/auth');

router.use(protect); // All strategy routes require auth

router.route('/').get(getStrategies).post(createStrategy);
router.get('/templates', getStrategyTemplates);
router.route('/:id').get(getStrategy).put(updateStrategy).delete(deleteStrategy);

module.exports = router;
