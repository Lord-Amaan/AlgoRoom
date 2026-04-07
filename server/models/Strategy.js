const mongoose = require('mongoose');

const LegSchema = new mongoose.Schema({
  qty: { type: Number, default: 0 },
  position: { type: String, enum: ['BUY', 'SELL'] },
  optionType: { type: String, enum: ['CALL', 'PUT'] },
  expiry: { type: String, enum: ['WEEKLY', 'MONTHLY'] },
  strikeCriteria: { type: String }, // e.g. "ATM pt"
  strikeType: { type: String, enum: ['ATM', 'OTM_1', 'OTM_2', 'OTM_3', 'ITM_1', 'ITM_2'] },
  slType: { type: String, enum: ['SL%', 'SL_POINTS'] },
  sl: { type: Number },
  slOnPrice: { type: String, enum: ['ENTRY', 'CURRENT'] },
  tpType: { type: String, enum: ['TP%', 'TP_POINTS'] },
  tp: { type: Number },
  tpOnPrice: { type: String, enum: ['ENTRY', 'CURRENT'] },
  isActive: { type: Boolean, default: true }
});

const StrategySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // from Clerk
  name: { type: String, required: true },
  strategyType: {
    type: String,
    enum: ['TIME_BASED', 'INDICATOR_BASED', 'STOCKS_FUTURES']
  },
  isActive: { type: Boolean, default: false }, // true when deployed/enabled for trading
  instruments: [{ type: String }],
  orderConfig: {
    type: { type: String, enum: ['MIS', 'CNC', 'BTST'] },
    startTime: String,   // "09:16"
    squareOff: String,   // "15:15"
    activeDays: [{ type: String, enum: ['MON','TUE','WED','THU','FRI'] }]
  },
  legs: [LegSchema],
  riskManagement: {
    exitOnProfit: Number,
    exitOnLoss: Number,
    noTradeAfter: String,
    profitTrailing: {
      type: String,
      enum: ['NO_TRAILING', 'LOCK_FIX', 'TRAIL_PROFIT', 'LOCK_AND_TRAIL']
    }
  },
  advanceFeatures: {
    moveSLtoCost: Boolean,
    exitAllOnSLTgt: Boolean,
    prePunchSL: Boolean,
    waitAndTrade: Boolean,
    premiumDifference: Boolean,
    reEntryExecute: Boolean,
    trailSL: Boolean
  }
}, { timestamps: true });

// Add unique constraint on (userId, name) - no duplicate strategy names per user
StrategySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Strategy', StrategySchema);
