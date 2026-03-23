const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    broker: {
      type: String,
      enum: ['zerodha', 'angel', 'upstox', 'fyers', 'none'],
      default: 'none',
    },
    brokerApiKey: { type: String },
    brokerApiSecret: { type: String },
    paperTrading: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
