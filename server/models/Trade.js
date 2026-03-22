const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
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
      enum: ['CE', 'PE'],
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: Number,
    },
    quantity: {
      type: Number,
      required: true,
    },
    pnl: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
    },
    entryTime: {
      type: Date,
      default: Date.now,
    },
    exitTime: {
      type: Date,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    isPaper: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trade', tradeSchema);
