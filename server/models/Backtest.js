const mongoose = require('mongoose');

const daywiseResultSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  pnl: { type: Number, default: 0 },
  trades: { type: Number, default: 0 },
});

const backtestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    strategy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strategy',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    instrument: {
      type: String,
      required: true,
    },
    timeframe: {
      type: String,
      default: '1min',
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

    // Individual trade results
    trades: [{
      legIndex: { type: Number, default: 0 },
      entryPrice: { type: Number },
      exitPrice: { type: Number },
      entryTime: { type: Date },
      exitTime: { type: Date },
      pnl: { type: Number, default: 0 },
      status: { type: String, enum: ['open', 'closed'], default: 'closed' }
    }],

    // Daywise breakdown
    daywiseResults: [daywiseResultSchema],

    // Raw results from Python engine
    rawResults: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Backtest', backtestSchema);
