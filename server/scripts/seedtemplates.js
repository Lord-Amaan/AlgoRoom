/**
 * Algoroom — Prebuilt Strategy Templates
 * Run once: node seedTemplates.js
 * All strategies are NSE options, intraday (MIS), weekly expiry by default.
 */

const mongoose = require('mongoose');
const StrategyTemplate = require('../models/StrategyTemplate');

// seedTemplates.js — replace the dotenv line with this
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const templates = [
  // ─────────────────────────────────────────────
  // 1. SHORT STRADDLE
  // Sell ATM Call + Sell ATM Put
  // Best for: Low IV, sideways market (classic Nifty 0DTE/weekly)
  // ─────────────────────────────────────────────
  {
    name: 'Short Straddle',
    description:
      'Sell ATM Call and ATM Put at the same strike. Profits when market stays near entry. Max risk is unlimited on both sides — use strict SL.',
    category: 'NEUTRAL',
    riskProfile: 'HIGH',
    instruments: ['NIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:20',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'SELL',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 50,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 50,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 50,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 50,
        tpOnPrice: 'ENTRY',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 3000,
      exitOnLoss: 5000,
      noTradeAfter: '14:00',
      profitTrailing: 'LOCK_AND_TRAIL'
    },
    advanceFeatures: {
      moveSLtoCost: false,
      exitAllOnSLTgt: true,
      prePunchSL: true,
      waitAndTrade: false,
      premiumDifference: false,
      reEntryExecute: false,
      trailSL: true
    }
  },

  // ─────────────────────────────────────────────
  // 2. SHORT STRANGLE
  // Sell OTM Call + Sell OTM Put
  // More forgiving than straddle, lower premium
  // ─────────────────────────────────────────────
  {
    name: 'Short Strangle',
    description:
      'Sell OTM Call and OTM Put. Wider breakeven than straddle, lower premium collected. Works well on rangebound weekly expiry.',
    category: 'NEUTRAL',
    riskProfile: 'HIGH',
    instruments: ['NIFTY', 'BANKNIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:20',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'SELL',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 75,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 60,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 75,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 60,
        tpOnPrice: 'ENTRY',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 2500,
      exitOnLoss: 6000,
      noTradeAfter: '14:00',
      profitTrailing: 'LOCK_AND_TRAIL'
    },
    advanceFeatures: {
      moveSLtoCost: false,
      exitAllOnSLTgt: true,
      prePunchSL: true,
      waitAndTrade: false,
      premiumDifference: false,
      reEntryExecute: false,
      trailSL: true
    }
  },

  // ─────────────────────────────────────────────
  // 3. IRON CONDOR
  // Sell OTM_1 C+P, Buy OTM_2 C+P — defined risk
  // ─────────────────────────────────────────────
  {
    name: 'Iron Condor',
    description:
      'Sell OTM_1 Call & Put, hedge with OTM_2 Call & Put. Defined max loss — best for beginners doing neutral strategies. Premium is lower but risk is capped.',
    category: 'NEUTRAL',
    riskProfile: 'LOW',
    instruments: ['NIFTY', 'BANKNIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:20',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      // Short OTM Call (income leg)
      {
        qty: 1,
        position: 'SELL',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 100,
        slOnPrice: 'ENTRY',
        isActive: true
      },
      // Long OTM Call (hedge)
      {
        qty: 1,
        position: 'BUY',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_2',
        strikeCriteria: 'OTM 2 steps',
        isActive: true
      },
      // Short OTM Put (income leg)
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 100,
        slOnPrice: 'ENTRY',
        isActive: true
      },
      // Long OTM Put (hedge)
      {
        qty: 1,
        position: 'BUY',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_2',
        strikeCriteria: 'OTM 2 steps',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 2000,
      exitOnLoss: 3000,
      noTradeAfter: '14:30',
      profitTrailing: 'LOCK_FIX'
    },
    advanceFeatures: {
      moveSLtoCost: false,
      exitAllOnSLTgt: true,
      prePunchSL: false,
      waitAndTrade: false,
      premiumDifference: true,
      reEntryExecute: false,
      trailSL: false
    }
  },

  // ─────────────────────────────────────────────
  // 4. BULL CALL SPREAD
  // Buy ATM Call + Sell OTM_1 Call
  // Directional bullish, defined risk
  // ─────────────────────────────────────────────
  {
    name: 'Bull Call Spread',
    description:
      'Buy ATM Call, sell OTM_1 Call to offset premium. Capped upside but cheaper entry. Good for mild bullish views on BankNifty/Nifty.',
    category: 'BULLISH',
    riskProfile: 'LOW',
    instruments: ['BANKNIFTY', 'NIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:25',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'BUY',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 40,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 80,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'SELL',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 4000,
      exitOnLoss: 2500,
      noTradeAfter: '13:30',
      profitTrailing: 'TRAIL_PROFIT'
    },
    advanceFeatures: {
      moveSLtoCost: true,
      exitAllOnSLTgt: true,
      prePunchSL: false,
      waitAndTrade: true,
      premiumDifference: false,
      reEntryExecute: false,
      trailSL: true
    }
  },

  // ─────────────────────────────────────────────
  // 5. BEAR PUT SPREAD
  // Buy ATM Put + Sell OTM_1 Put
  // Defined-risk bearish play
  // ─────────────────────────────────────────────
  {
    name: 'Bear Put Spread',
    description:
      'Buy ATM Put, sell OTM_1 Put to reduce cost. Defined max loss. Ideal for bearish intraday views after gap-up opens or heavy resistance zones.',
    category: 'BEARISH',
    riskProfile: 'LOW',
    instruments: ['BANKNIFTY', 'NIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:25',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'BUY',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 40,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 80,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 4000,
      exitOnLoss: 2500,
      noTradeAfter: '13:30',
      profitTrailing: 'TRAIL_PROFIT'
    },
    advanceFeatures: {
      moveSLtoCost: true,
      exitAllOnSLTgt: true,
      prePunchSL: false,
      waitAndTrade: true,
      premiumDifference: false,
      reEntryExecute: false,
      trailSL: true
    }
  },

  // ─────────────────────────────────────────────
  // 6. LONG STRADDLE
  // Buy ATM Call + Buy ATM Put (pre-event play)
  // ─────────────────────────────────────────────
  {
    name: 'Long Straddle',
    description:
      'Buy ATM Call and ATM Put. Profits from big moves in either direction — ideal before RBI policy, Budget, or F&O expiry when breakout is expected but direction is unclear.',
    category: 'VOLATILE',
    riskProfile: 'MEDIUM',
    instruments: ['NIFTY', 'BANKNIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:16',
      squareOff: '15:15',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'BUY',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 30,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 100,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'BUY',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 30,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 100,
        tpOnPrice: 'ENTRY',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 6000,
      exitOnLoss: 4000,
      noTradeAfter: '11:00',
      profitTrailing: 'TRAIL_PROFIT'
    },
    advanceFeatures: {
      moveSLtoCost: true,
      exitAllOnSLTgt: true,
      prePunchSL: false,
      waitAndTrade: false,
      premiumDifference: false,
      reEntryExecute: false,
      trailSL: true
    }
  },

  // ─────────────────────────────────────────────
  // 7. BULL PUT SPREAD (Credit Spread)
  // Sell ATM Put + Buy OTM_1 Put
  // Bullish, premium collection, defined risk
  // ─────────────────────────────────────────────
  {
    name: 'Bull Put Spread',
    description:
      'Sell ATM Put and buy OTM_1 Put as hedge. Net credit received. Profits when market stays flat or moves up — popular for weekly premium selling with capped downside.',
    category: 'BULLISH',
    riskProfile: 'LOW',
    instruments: ['NIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:20',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'ATM',
        strikeCriteria: 'ATM',
        slType: 'SL%',
        sl: 80,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 50,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      {
        qty: 1,
        position: 'BUY',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 3000,
      exitOnLoss: 4000,
      noTradeAfter: '14:00',
      profitTrailing: 'LOCK_FIX'
    },
    advanceFeatures: {
      moveSLtoCost: false,
      exitAllOnSLTgt: true,
      prePunchSL: true,
      waitAndTrade: false,
      premiumDifference: true,
      reEntryExecute: false,
      trailSL: false
    }
  },

  // ─────────────────────────────────────────────
  // 8. JADE LIZARD
  // Sell OTM_1 Put + Sell OTM_1 Call + Buy OTM_2 Call
  // No upside risk, limited downside
  // ─────────────────────────────────────────────
  {
    name: 'Jade Lizard',
    description:
      'Sell OTM Put + Short Call Spread (sell OTM_1 Call, buy OTM_2 Call). Net premium > call spread width = zero upside risk. Slightly bullish/neutral with no risk on call side.',
    category: 'NEUTRAL',
    riskProfile: 'MEDIUM',
    instruments: ['NIFTY', 'BANKNIFTY'],
    strategyType: 'TIME_BASED',
    orderConfig: {
      type: 'MIS',
      startTime: '09:20',
      squareOff: '15:10',
      activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    legs: [
      // Short OTM Put
      {
        qty: 1,
        position: 'SELL',
        optionType: 'PUT',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 80,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 60,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      // Short OTM Call (income)
      {
        qty: 1,
        position: 'SELL',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_1',
        strikeCriteria: 'OTM 1 step',
        slType: 'SL%',
        sl: 80,
        slOnPrice: 'ENTRY',
        tpType: 'TP%',
        tp: 60,
        tpOnPrice: 'ENTRY',
        isActive: true
      },
      // Long OTM Call (hedge cap)
      {
        qty: 1,
        position: 'BUY',
        optionType: 'CALL',
        expiry: 'WEEKLY',
        strikeType: 'OTM_2',
        strikeCriteria: 'OTM 2 steps',
        isActive: true
      }
    ],
    riskManagement: {
      exitOnProfit: 3500,
      exitOnLoss: 5000,
      noTradeAfter: '14:00',
      profitTrailing: 'LOCK_AND_TRAIL'
    },
    advanceFeatures: {
      moveSLtoCost: false,
      exitAllOnSLTgt: true,
      prePunchSL: true,
      waitAndTrade: false,
      premiumDifference: true,
      reEntryExecute: false,
      trailSL: true
    }
  }
];

async function seedTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Upsert each template by name so re-running is safe
    for (const template of templates) {
      await StrategyTemplate.findOneAndUpdate(
        { name: template.name },
        template,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Seeded: ${template.name}`);
    }

    console.log('\nAll templates seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedTemplates();