const express = require('express');
const router = express.Router();
const {
  runBacktest,
  getBacktests,
  getBacktest,
} = require('../controllers/backtestController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getBacktests).post(runBacktest);
router.route('/:id').get(getBacktest);

module.exports = router;
