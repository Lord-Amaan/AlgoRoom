const mongoose = require('mongoose');

// Reuse same LegSchema structure
const LegSchema = new mongoose.Schema({
  qty: { type: Number, default: 1 },
  position: { type: String, enum: ['BUY', 'SELL'] },
  optionType: { type: String, enum: ['CALL', 'PUT'] },
  expiry: { type: String, enum: ['WEEKLY', 'MONTHLY'] },
  strikeCriteria: { type: String },
  strikeType: { type: String, enum: ['ATM', 'OTM_1', 'OTM_2', 'OTM_3', 'ITM_1', 'ITM_2'] },
  slType: { type: String, enum: ['SL%', 'SL_POINTS'] },
  sl: { type: Number },
  slOnPrice: { type: String, enum: ['ENTRY', 'CURRENT'] },
  tpType: { type: String, enum: ['TP%', 'TP_POINTS'] },
  tp: { type: Number },
  tpOnPrice: { type: String, enum: ['ENTRY', 'CURRENT'] },
  isActive: { type: Boolean, default: true }
});

const StrategyTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['NEUTRAL', 'BULLISH', 'BEARISH', 'VOLATILE'],
    required: true
  },
  riskProfile: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH']
  },
  instruments: [{ type: String }],
  strategyType: {
    type: String,
    enum: ['TIME_BASED', 'INDICATOR_BASED', 'STOCKS_FUTURES']
  },
  orderConfig: {
    type: { type: String, enum: ['MIS', 'CNC', 'BTST'] },
    startTime: String,
    squareOff: String,
    activeDays: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }]
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
  },
  isPrebuilt: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('StrategyTemplate', StrategyTemplateSchema);