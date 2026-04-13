const mongoose = require('mongoose');

const daywiseResultSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  pnl: { type: Number, default: 0 },
  trades: { type: Number, default: 0 },
});

const tradeSchema = new mongoose.Schema(
  {
    legIndex: { type: Number, default: 0 },
    entryPrice: { type: Number, default: 0 },
    exitPrice: { type: Number, default: 0 },
    entryTime: { type: Date, default: null },
    exitTime: { type: Date, default: null },
    pnl: { type: Number, default: 0 },
    status: { type: String, default: 'closed' },
  },
  { _id: false }
);

const backtestSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    strategy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strategy',
      required: true,
    },
    instrument: {
      type: String,
      default: 'NIFTY',
    },
    timeframe: {
      type: String,
      default: '1min',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    // Summary results
    totalPnl: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    winDays: { type: Number, default: 0 },
    lossDays: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 },
    maxProfit: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },

    // Daywise breakdown
    daywiseResults: [daywiseResultSchema],

    // Trade-level results
    trades: [tradeSchema],

    // Full analytics payload from python-engine
    rawResults: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Backtest', backtestSchema);
