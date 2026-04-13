const mongoose = require('mongoose');

const daywiseResultSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  pnl: { type: Number, default: 0 },
  netPnl: { type: Number, default: 0 },
  trades: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  exitReason: { type: String, enum: ['SL_HIT', 'TP_HIT', 'SQUARE_OFF', 'EXPIRY', 'NO_TRADE'] },
  underlyingOpen: { type: Number },
  underlyingClose: { type: Number },
  entryTime: { type: String },
  exitTime: { type: String },
});

const tradeLogSchema = new mongoose.Schema({
  legIndex: { type: Number, default: 0 },
  strike: { type: Number },
  optionType: { type: String, enum: ['CALL', 'PUT'] },
  position: { type: String, enum: ['BUY', 'SELL'] },
  expiry: { type: Date },
  entryPrice: { type: Number },
  exitPrice: { type: Number },
  entryTime: { type: Date },
  exitTime: { type: Date },
  exitReason: { type: String, enum: ['SL_HIT', 'TP_HIT', 'SQUARE_OFF', 'EXPIRY'] },
  pnl: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  netPnl: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'closed' }
});

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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    instruments: [{ type: String }],
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
    netPnl: { type: Number, default: 0 },           // totalPnl minus totalCharges
    totalCharges: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    winDays: { type: Number, default: 0 },
    lossDays: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 },
    maxProfit: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    avgDailyPnl: { type: Number, default: 0 },
    consecutiveWinDays: { type: Number, default: 0 },
    consecutiveLossDays: { type: Number, default: 0 },

    // Individual trade log (renamed from trades to avoid conflict with totalTrades)
    tradeLog: [tradeLogSchema],

    // Daywise breakdown
    daywiseResults: [daywiseResultSchema],

    // Meta
    engineVersion: { type: String },

    // Raw output from Python engine — safety net, always populated
    rawResults: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Backtest', backtestSchema);