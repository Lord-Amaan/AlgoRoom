const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    strategy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strategy',
    },
    instrument: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    optionType: {
      type: String,
      enum: ['CALL', 'PUT'],
    },
    legIndex: {
      type: Number,
      default: 0,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unrealizedPnl: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPaper: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Position', positionSchema);
