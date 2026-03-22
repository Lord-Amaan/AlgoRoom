const mongoose = require('mongoose');

const legSchema = new mongoose.Schema({
  instrument: {
    type: String,
    required: true,
    enum: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'],
  },
  position: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL'],
  },
  optionType: {
    type: String,
    required: true,
    enum: ['CE', 'PE'],
  },
  expiry: {
    type: String,
    required: true,
    enum: ['WEEKLY', 'MONTHLY'],
  },
  strikeType: {
    type: String,
    required: true,
    enum: ['ATM', 'ITM1', 'ITM2', 'ITM3', 'OTM1', 'OTM2', 'OTM3'],
  },
  lots: {
    type: Number,
    default: 1,
    min: 1,
  },
  stopLoss: {
    type: Number,
    default: 0,
  },
  takeProfit: {
    type: Number,
    default: 0,
  },
});

const strategySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Strategy name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    legs: [legSchema],
    entryTime: {
      type: String,
      default: '09:20',
    },
    exitTime: {
      type: String,
      default: '15:15',
    },
    overallStopLoss: {
      type: Number,
      default: 0,
    },
    overallTakeProfit: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Strategy', strategySchema);
