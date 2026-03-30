# Missing Implementation Guide - For Python Colleague

## Overview

This document maps **what the frontend sends** → **what the API receives** → **what Python needs**

---

## 1. FRONTEND DATA FLOW

### StrategyBuilder sends this structure:

```javascript
{
  name: "My Bull Call Spread",
  strategyType: "INDICATOR_BASED",  // TIME_BASED | INDICATOR_BASED | STOCKS_FUTURES
  instruments: ["NIFTY", "BANKNIFTY"],

  orderConfig: {
    type: "MIS",                    // MIS | CNC | BTST
    startTime: "09:16",
    squareOff: "15:15",
    activeDays: ["MON","TUE","WED","THU","FRI"]
  },

  legs: [
    {
      qty: 50,
      position: "BUY",              // BUY | SELL
      optionType: "CALL",           // CALL | PUT
      expiry: "WEEKLY",             // WEEKLY | MONTHLY
      strikeType: "ATM",            // ATM | OTM_1 | OTM_2 | OTM_3 | ITM_1 | ITM_2
      slType: "SL%",                // SL% | SL_POINTS
      sl: 5,                        // 5% or 500 points
      slOnPrice: "ENTRY",           // ENTRY | CURRENT
      tpType: "TP%",                // TP% | TP_POINTS
      tp: 10,                       // 10% or 1000 points
      tpOnPrice: "ENTRY",           // ENTRY | CURRENT
      isActive: true
    },
    {
      qty: 50,
      position: "SELL",
      optionType: "CALL",
      expiry: "WEEKLY",
      strikeType: "OTM_1",
      slType: "SL%",
      sl: 5,
      slOnPrice: "ENTRY",
      tpType: "TP%",
      tp: 10,
      tpOnPrice: "ENTRY",
      isActive: true
    }
  ],

  riskManagement: {
    exitOnProfit: 1000,             // Exit position if total P&L > 1000
    exitOnLoss: -500,               // Exit position if total P&L < -500
    noTradeAfter: "14:30",          // Don't enter new trades after this time
    profitTrailing: "TRAIL_PROFIT"  // NO_TRAILING | LOCK_FIX | TRAIL_PROFIT | LOCK_AND_TRAIL
  },

  advanceFeatures: {
    moveSLtoCost: true,             // Move SL to entry when profitable
    exitAllOnSLTgt: false,          // Exit ALL legs if any hits SL
    prePunchSL: false,              // Show SL/TP in pre-market
    waitAndTrade: false,            // Wait for specific condition
    premiumDifference: false,       // Track premium differential
    reEntryExecute: false,          // Re-enter after exit
    trailSL: true                   // Dynamic trailing SL
  }
}
```

---

## 2. API IMPLEMENTATION STATUS

### ✅ WORKING

- POST `/api/strategies` - Create strategy (data stored with all fields above)
- GET `/api/strategies` - List all user strategies
- GET `/api/strategies/:id` - Get single strategy
- PUT `/api/strategies/:id` - Update strategy
- DELETE `/api/strategies/:id` - Delete strategy

### ❌ NOT IMPLEMENTED

- POST `/api/backtest` - **RUN BACKTEST** ← CRITICAL
- GET `/api/backtest` - Get all backtests
- GET `/api/backtest/:id` - Get specific backtest results

---

## 3. BACKEND CONTROLLER - WHAT NEEDS TO BE BUILT

### `server/controllers/backtestController.js`

```javascript
exports.runBacktest = async (req, res) => {
  // REQUEST BODY from frontend:
  // {
  //   strategyId: "xxx",              // Get strategy from DB
  //   startDate: "2025-01-01",
  //   endDate: "2025-03-30",
  //   instrument: "NIFTY",            // Which symbol to backtest
  //   candleTimeframe: "1min"         // 1min, 5min, 15min, 1hour, 1day (if provided)
  // }
  // STEPS NEEDED:
  // 1. Validate user auth (extract userId from request)
  // 2. Fetch strategy from MongoDB by ID
  // 3. Validate strategy belongs to user
  // 4. Fetch historical OHLC data (need data source!)
  // 5. Call Python engine API (POST http://localhost:8000/backtest)
  //    - Send: strategy config + OHLC data
  //    - Receive: backtest results
  // 6. Transform results
  // 7. Save to Backtest model in MongoDB
  // 8. Return results to frontend
};

exports.getBacktests = async (req, res) => {
  // Get all backtests for user
  // Return: [{ strategyId, results, createdAt }, ...]
};

exports.getBacktest = async (req, res) => {
  // Get specific backtest details
};
```

---

## 4. DATA SOURCE - MISSING!

**Problem:** You need historical OHLC data to backtest.

**Options:**

- [ ] NSE/BSE API (real Indian market data)
- [ ] Zerodha/Angel/Upstox API (if user has broker account)
- [ ] Free API (Finnhub, yfinance, etc.) - limited for Indian options
- [ ] CSV upload from user
- [ ] Mock data for testing

**Recommendation:** Start with mock/sample data for MVP, then integrate real API.

---

## 5. PYTHON ENGINE - WHAT PYTHON COLLEAGUE NEEDS TO IMPLEMENT

### Phase 1 (CRITICAL - Do First)

#### 5.1 Update Python Schema ✅

**File:** `app/schemas/backtest.py`

```python
# CURRENT: Only accepts RSI params
# NEEDED: Accept full strategy config

class LegConfig(BaseModel):
    qty: int
    position: str           # "BUY" or "SELL"
    optionType: str         # "CALL" or "PUT"
    strikeType: str         # "ATM", "OTM_1", etc.
    slType: str             # "SL%" or "SL_POINTS"
    sl: float
    slOnPrice: str          # "ENTRY" or "CURRENT"
    tpType: str             # "TP%" or "TP_POINTS"
    tp: float
    tpOnPrice: str          # "ENTRY" or "CURRENT"
    # ... rest of fields

class StrategyConfig(BaseModel):
    strategyType: str
    instruments: List[str]
    legs: List[LegConfig]
    orderConfig: OrderConfig
    riskManagement: RiskManagement
    advanceFeatures: AdvancedFeatures

class BacktestRequest(BaseModel):
    candles: List[CandleData]
    strategy: StrategyConfig    # ← CHANGE THIS (currently accepts Dict)
```

#### 5.2 Strike Selection Engine

**File:** `app/engines/strike_engine.py` (NEW)

```python
class StrikeSelector:
    """
    Input: spot_price=24500, strikeType="ATM"
    Output: selected_strike=24500

    Input: spot_price=24500, strikeType="OTM_1", option="CALL"
    Output: selected_strike=24600  (1 step above)
    """

    def get_strike(self, spot, strikeType, optionType):
        # ATM: closest to spot
        # OTM_1, OTM_2, OTM_3: away from profit direction
        # ITM_1, ITM_2: toward profit direction
        # Step size: 100 for NIFTY/BANKNIFTY, 50 for FINNIFTY
        pass
```

#### 5.3 Position Manager

**File:** `app/engines/position_manager.py` (NEW)

```python
class PositionManager:
    """
    Tracks multi-leg positions (multiple BUY/SELL CALLs/PUTs together)

    Example: Bull Call Spread
    - Leg 0: BUY CALL at 24500
    - Leg 1: SELL CALL at 24600
    Both enter at same time, exit together
    """

    def open_position(self, legs, entry_prices):
        # Record multi-leg entry
        pass

    def update_unrealized_pnl(self, current_prices):
        # Calculate combined P&L of all legs
        pass

    def close_position(self, exit_prices):
        # Calculate final P&L of multi-leg trade
        pass
```

#### 5.4 Time Validator

**File:** `app/engines/time_validator.py` (NEW)

```python
class TimeValidator:
    def is_trading_hour(self, timestamp, startTime, squareOffTime):
        # timestamp="2025-03-30 10:30:00"
        # startTime="09:16"
        # squareOffTime="15:15"
        # Return: True if within hours, False otherwise
        pass

    def is_active_day(self, timestamp, activeDays):
        # timestamp="2025-03-30" (Monday)
        # activeDays=["MON", "TUE", "WED", "THU", "FRI"]
        # Return: True if allowed, False otherwise
        pass
```

### Phase 2 (Next)

#### 5.5 Risk Management Engine

```python
class RiskManager:
    def check_sl(self, position, currentPrice, legConfig):
        # If slOnPrice="ENTRY": compare to entry price
        # If slOnPrice="CURRENT": track highest/lowest
        # If slType="SL%": calculate percentage
        # If slType="SL_POINTS": use absolute points
        # Return: True if SL hit, False otherwise
        pass

    def check_tp(self, position, currentPrice, legConfig):
        # Same logic as SL but for take profit
        pass

    def apply_trailing_stop(self, position, trailingType):
        # NO_TRAILING: static SL/TP
        # LOCK_FIX: lock profit when positive
        # TRAIL_PROFIT: continuously update SL to highest price - buffer
        # LOCK_AND_TRAIL: lock then trail
        pass

    def check_global_limits(self, totalPnl, exitOnProfit, exitOnLoss):
        # Check if P&L hit overall targets
        pass
```

#### 5.6 Execution Engine

```python
class ExecutionEngine:
    def process_candle(self, candle, strategy):
        # For each candle:
        # 1. Check if trading is allowed (time, day)
        # 2. If no position: check entry signal
        # 3. If position open: check SL/TP/global limits
        # 4. Return completed trades if any exit triggered
        pass
```

### Phase 3 (Later)

#### 5.7 Advanced Features

```python
class AdvancedFeaturesEngine:
    def handle_move_sl_to_cost(self):
        # When P&L > threshold, move SL to entry
        pass

    def handle_exit_all_on_sl_tgt(self):
        # If any leg hits SL, exit entire position
        pass

    def handle_re_entry(self):
        # Allow re-entering after exit
        pass
```

---

## 6. DATA MODELS STATUS

### MongoDB Models

- ✅ User - stores user info
- ✅ Strategy - stores strategy config (all fields above)
- ✅ Trade - stores individual trades (updated: added legIndex, changed CE/PE to CALL/PUT)
- ✅ Position - tracks open positions (updated: added legIndex, changed CE/PE to CALL/PUT)
- ✅ Backtest - stores backtest results (updated: added trades array with details)

---

## 7. MISSING PIECES SUMMARY

| Component               | Status      | Who        | Priority |
| ----------------------- | ----------- | ---------- | -------- |
| **Data Source**         | ❌ MISSING  | MERN Dev   | CRITICAL |
| **Backtest Controller** | ❌ STUB     | MERN Dev   | CRITICAL |
| **Python Schema**       | ⚠️ RSI-only | Python Dev | CRITICAL |
| **Strike Selector**     | ❌ MISSING  | Python Dev | CRITICAL |
| **Position Manager**    | ❌ MISSING  | Python Dev | CRITICAL |
| **Time Validator**      | ❌ MISSING  | Python Dev | CRITICAL |
| **Risk Manager**        | ❌ MISSING  | Python Dev | HIGH     |
| **Execution Engine**    | ❌ MISSING  | Python Dev | HIGH     |
| **Advanced Features**   | ❌ MISSING  | Python Dev | MEDIUM   |

---

## 8. EXACT API CONTRACT

### Backtest Endpoint

**POST** `/api/backtest`

```json
REQUEST BODY:
{
  "strategyId": "65f123abc...",
  "instrument": "NIFTY",
  "startDate": "2025-01-01",
  "endDate": "2025-03-30",
  "timeframe": "1min"
}

BACKEND DOES:
1. Fetch strategy from DB
2. Fetch OHLC data
3. Transform to Python request:
{
  "candles": [
    {"timestamp": "2025-01-01 09:16:00", "open": 24500, "high": 24520, "low": 24480, "close": 24505, "volume": 100000},
    ...
  ],
  "strategy": {
    "strategyType": "INDICATOR_BASED",
    "instruments": ["NIFTY"],
    "legs": [...],
    "orderConfig": {...},
    "riskManagement": {...},
    "advanceFeatures": {...}
  }
}

4. POST to Python: http://localhost:8000/backtest
5. Receive response:
{
  "pnl": 2500.50,
  "totalTrades": 15,
  "winRate": 73.33,
  "maxDrawdown": -800,
  "trades": [
    {
      "legIndex": 0,
      "entryPrice": 1250,
      "exitPrice": 1275,
      "entryTime": "2025-01-15 10:30:00",
      "exitTime": "2025-01-15 11:00:00",
      "pnl": 25,
      "status": "closed"
    }
  ]
}

6. Save to Backtest model
7. Return to frontend

RESPONSE:
{
  "success": true,
  "data": {
    "backtestId": "65f456def...",
    "pnl": 2500.50,
    "totalTrades": 15,
    "winRate": 73.33,
    "trades": [...]
  }
}
```

---

## 9. CHECKLIST FOR PYTHON COLLEAGUE

### Phase 1 (Required First)

- [ ] Update `backtest.py` schema to accept full StrategyConfig
- [ ] Create `strike_engine.py` with strike selection logic
- [ ] Create `position_manager.py` for multi-leg tracking
- [ ] Create `time_validator.py` for trading hours validation
- [ ] Update `runner.py` to use new engines instead of RSI-only
- [ ] Update `/backtest` endpoint to use new runner
- [ ] Write tests for Phase 1

### Phase 2

- [ ] Create `risk_engine.py` for SL/TP logic
- [ ] Create `execution_engine.py` to orchestrate backtesting
- [ ] Implement trailing stops
- [ ] Implement global P&L limits

### Phase 3

- [ ] Create `advanced_features.py`
- [ ] Handle re-entry logic
- [ ] Handle premium differences
- [ ] Add more test coverage

---

## 10. QUESTIONS FOR PYTHON COLLEAGUE

Before starting, clarify:

1. **Data Source**: Where do we get OHLC data?
   - Live API integration?
   - CSV upload?
   - Mock data for testing?

2. **Option Pricing**: How to price options?
   - Use close price as proxy?
   - Implement Black-Scholes?
   - Use historical option prices (if available)?

3. **Strike Selection**: For "ATM", do we use:
   - Exact close price of that candle?
   - Previous day close?
   - Separate reference price?

4. **Signal Generation**: What signals should trigger entry?
   - RSI as default?
   - Moving average crossover?
   - User can configure?

5. **Partial Exits**: Support partial position closes?
   - Or only full exit?

---

## 11. EXAMPLE BACKTEST FLOW

```
User clicks "Backtest" on Strategy "Bull Call Spread"
                    ↓
Frontend sends: { strategyId: "xxx", instrument: "NIFTY", dates... }
                    ↓
Backend Controller:
  1. Get strategy from DB ← Already has all config!
  2. Get OHLC data for NIFTY Jan 2025
  3. For each candle:
     a. Check if trading hour (09:16-15:15)
     b. Check if active day (Mon-Fri)
     c. Get strike prices (ATM=24500, OTM_1=24600)
     d. Check if entry signal triggered
     e. If in position: check SL/TP/trailing/global limits
                    ↓
Python Engine processes:
  - 1960 candles (1 month of 1-min data)
  - 47 entry signals detected
  - Opens 47 multi-leg positions
  - Closes when: SL hit (18), TP hit (22), Time exit (7)
  - Result: P&L = +2500, Win Rate = 73%
                    ↓
Backend saves results to Backtest model
                    ↓
Frontend displays:
  - "P&L: ₹2,500"
  - "Win Rate: 73%"
  - "Equity Curve" chart
  - List of all 47 trades with entry/exit times
```

---

## Need More Details?

See `PYTHON_ENGINE_SPEC.md` for technical deep-dive on each component.
