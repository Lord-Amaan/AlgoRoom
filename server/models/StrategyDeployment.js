const mongoose = require('mongoose');

const strategyDeploymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    strategy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Strategy',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['PAPER', 'LIVE'],
      default: 'PAPER',
      index: true,
    },
    status: {
      type: String,
      enum: ['STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'ERROR'],
      default: 'STARTING',
      index: true,
    },
    instrument: {
      type: String,
      required: true,
      default: 'NIFTY',
    },
    timeframe: {
      type: String,
      default: '1min',
    },
    capital: {
      type: Number,
      default: 100000,
    },
    maxDailyLoss: {
      type: Number,
      default: 2000,
    },
    pollIntervalSec: {
      type: Number,
      default: 20,
    },
    realizedPnl: {
      type: Number,
      default: 0,
    },
    unrealizedPnl: {
      type: Number,
      default: 0,
    },
    totalPnl: {
      type: Number,
      default: 0,
    },
    lastPrice: {
      type: Number,
      default: 0,
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: {
      type: Date,
    },
    stopReason: {
      type: String,
      default: '',
    },
    lastError: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

strategyDeploymentSchema.index({ userId: 1, strategy: 1, status: 1 });

module.exports = mongoose.model('StrategyDeployment', strategyDeploymentSchema);
