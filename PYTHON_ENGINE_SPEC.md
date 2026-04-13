# Python Backtest Engine - Implementation Specification

## Executive Summary

The Python engine currently supports **RSI-only indicator backtesting**. To fully test user-created strategies, it needs to support:

- Multi-leg options strategies (BUY/SELL CALLs/PUTs)
- Strike selection logic (ATM, OTM levels)
- Time-based rules (market hours, active days)
- Risk management (SL/TP, profit trails)
- Advanced features (re-entry, premium differences, etc.)

---

## Current State ✅

**Working:**

- Basic RSI indicator calculation
- Simple long-only trade simulation
- OHLC candle parsing
- Trade P&L calculation
- Win rate reporting

**Hardcoded:**

- RSI period, buy threshold, sell threshold (no strategy flexibility)
- Only LONG positions (no SHORT/options)
- No multi-leg support
- No time validation

---

## Architecture Overview

```
BacktestRequest (from frontend)
    ↓
Strategy Validation (new)
    ↓
Data Preparation (enhance)
    ↓
Signal Generation (expand beyond RSI)
    ↓
Position Management (rewrite - support multi-leg)
    ↓
Trade Execution (new - handle options logic)
    ↓
Risk Management (new - SL/TP/Trailing)
    ↓
Reporting (enhance)
```

---

## Required Implementation Tasks

### PHASE 1: Foundation (Required First)

#### 1.1 Update BacktestRequest Schema

**File:** `app/schemas/backtest.py`

Add strategy configuration structure:

```python
class LegConfig(BaseModel):
    qty: int
    position: str  # "BUY" or "SELL"
    optionType: str  # "CALL" or "PUT"
    expiry: str  # "WEEKLY" or "MONTHLY"
    strikeType: str  # "ATM", "OTM_1", "OTM_2", etc
    slType: str  # "SL%" or "SL_POINTS"
    sl: float
    slOnPrice: str  # "ENTRY" or "CURRENT"
    tpType: str  # "TP%" or "TP_POINTS"
    tp: float
    tpOnPrice: str  # "ENTRY" or "CURRENT"
    isActive: bool = True

class StrategyConfig(BaseModel):
    strategyType: str  # "INDICATOR_BASED", "TIME_BASED", "STOCKS_FUTURES"
    instruments: List[str]  # ["NIFTY", "BANKNIFTY"]

    # Leg configuration
    legs: List[LegConfig]

    # Order config
    orderConfig: {
        type: str  # "MIS", "CNC", "BTST"
        startTime: str  # "09:16"
        squareOff: str  # "15:15"
        activeDays: List[str]  # ["MON", "TUE", "WED", "THU", "FRI"]
    }

    # Risk Management
    riskManagement: {
        exitOnProfit: Optional[float]  # Global profit target
        exitOnLoss: Optional[float]  # Global loss limit
        noTradeAfter: Optional[str]  # "14:30"
        profitTrailing: str  # "NO_TRAILING", "LOCK_FIX", "TRAIL_PROFIT", "LOCK_AND_TRAIL"
    }

    # Advanced Features
    advanceFeatures: {
        moveSLtoCost: bool  # Move SL to entry price when profitable
        exitAllOnSLTgt: bool  # Exit all legs if ANY leg hits SL
        prePunchSL: bool  # Show SL/TP in pre-market
        waitAndTrade: bool  # Don't trade until specific signal
        premiumDifference: bool  # Track premium differences between legs
        reEntryExecute: bool  # Allow re-entry after exit
        trailSL: bool  # Dynamic trailing stop loss
    }

class BacktestRequest(BaseModel):
    candles: List[CandleData]
    strategy: StrategyConfig  # Replace the Dict[str, Any]
```

#### 1.2 Create Strike Selection Engine

**File:** `app/engines/strike_engine.py`

Responsibilities:

```python
class StrikeSelector:
    """
    Determines option strike prices based on spot price and strike type.

    Strike types: ATM, OTM_1, OTM_2, OTM_3, ITM_1, ITM_2
    """

    def get_strike_price(
        self,
        spot_price: float,
        strike_type: str,
        option_type: str,  # CALL or PUT
        strike_step: float = 100  # e.g., NIFTY moves in 100s
    ) -> float:
        """
        ATM (At The Money): Closest to spot
        OTM_1: 1 step away from ATM (in loss direction)
        OTM_2: 2 steps away
        ITM_1: 1 step toward profit (in profit direction)
        """
        pass
```

#### 1.3 Create Position Manager

**File:** `app/engines/position_manager.py`

Responsibilities:

```python
class PositionManager:
    """
    Manages multi-leg positions, calculates aggregate P&L, handles position state.
    """

    def open_position(self, legs: List[LegConfig], entry_prices: Dict) -> Position:
        """Open a multi-leg position"""
        pass

    def update_position(self, current_prices: Dict) -> PositionMetrics:
        """Update position with current market prices"""
        pass

    def close_position(self, exit_prices: Dict) -> TradeResult:
        """Close entire multi-leg position and calculate P&L"""
        pass

    def get_position_pnl(self) -> float:
        """Current unrealized P&L"""
        pass

    def check_exits(self) -> Optional[TradeResult]:
        """
        Check if any SL/TP conditions are met.
        Returns trade result if exit triggered, None otherwise.
        """
        pass
```

---

### PHASE 2: Signal Generation (Expand)

#### 2.1 Multi-Indicator Support

**File:** `app/indicators/` (new structure)

Currently only has RSI. Add:

- ✅ RSI (already done)
- Bollinger Bands
- MACD
- EMA Crossover
- Stochastic
- Support for user-defined threshold ranges

```python
# app/signals/signal_generator.py
class SignalGenerator:
    def generate_signal(
        self,
        df: pd.DataFrame,
        signal_rules: Dict  # Define which indicators and thresholds
    ) -> pd.Series:
        """Generate BUY/SELL/HOLD signals based on strategy rules"""
        pass
```

#### 2.2 Time-Based Filtering

**File:** `app/engines/time_validator.py`

```python
class TimeValidator:
    def is_trading_time(
        self,
        timestamp: str,  # "2025-03-30 10:30:00"
        start_time: str,  # "09:16"
        squareoff_time: str,  # "15:15"
        active_days: List[str]  # ["MON", "TUE", "WED"]
    ) -> bool:
        """Check if trade is allowed at this time"""
        pass

    def get_squareoff_time(self, timestamp: str) -> bool:
        """Check if it's time to square off"""
        pass
```

---

### PHASE 3: Trade Execution & Risk Management

#### 3.1 Trade Execution Engine

**File:** `app/engines/execution_engine.py`

```python
class ExecutionEngine:
    def __init__(self, strike_selector, position_manager, time_validator):
        pass

    def process_candle(
        self,
        candle: Dict,  # OHLC + timestamp
        signal: str,  # BUY/SELL/HOLD
        strategy: StrategyConfig
    ) -> Optional[TradeResult]:
        """
        Process each candle:
        1. Check if trading is allowed (time validation)
        2. Generate strike prices for each leg
        3. Check if entry signal triggered
        4. Check if any open position should exit (SL/TP)
        5. Return completed trade if exit triggered
        """
        pass
```

#### 3.2 Risk Management Engine

**File:** `app/engines/risk_engine.py`

```python
class RiskManager:
    """
    Implement:
    - Stop Loss logic (SL%, SL_POINTS)
    - Take Profit logic (TP%, TP_POINTS)
    - Trailing stops (TRAIL_PROFIT, LOCK_AND_TRAIL)
    - Global profit/loss limits
    - No-trade-after time
    - Re-entry logic
    """

    def check_stop_loss(
        self,
        position: Position,
        current_price: float,
        leg: LegConfig
    ) -> bool:
        """
        Check if SL triggered:
        - If slOnPrice == "ENTRY": calculate from entry price
        - If slOnPrice == "CURRENT": track highest/lowest hit price
        - Handle SL% vs SL_POINTS
        """
        pass

    def check_take_profit(self, position: Position, current_price: float) -> bool:
        """Similar logic for TP"""
        pass

    def apply_trailing_stop(self, position: Position, trailing_type: str):
        """
        NO_TRAILING: Static SL/TP
        LOCK_FIX: Lock profit at entry price when profitable, then trail
        TRAIL_PROFIT: Continuously trail the highest/lowest price
        LOCK_AND_TRAIL: Lock at entry, then trail after profit
        """
        pass

    def check_global_limits(
        self,
        total_pnl: float,
        exit_on_profit: Optional[float],
        exit_on_loss: Optional[float]
    ) -> bool:
        """Check if global profit/loss targets are hit"""
        pass
```

---

### PHASE 4: Advanced Features

#### 4.1 Advanced Feature Handler

**File:** `app/engines/advanced_features.py`

```python
class AdvancedFeaturesEngine:
    def handle_move_sl_to_cost(self, position: Position):
        """When profit > some threshold, move SL to cost price"""
        pass

    def handle_exit_all_on_sl_tgt(self, position: Position):
        """If checking if ANY leg hit SL, exit entire position"""
        pass

    def handle_premium_difference(self, legs: List[Position]):
        """Track premium paid vs received for multi-leg strategies"""
        pass

    def handle_reentry(self, position: Position) -> bool:
        """Allow position to be re-entered after close"""
        pass
```

---

## API Contract (Backtest Endpoint)

### REQUEST

```json
{
  "candles": [
    {
      "timestamp": "2025-03-30 09:16:00",
      "open": 24500,
      "high": 24520,
      "low": 24480,
      "close": 24505,
      "volume": 100000
    },
    {
      "timestamp": "2025-03-30 09:17:00",
      "open": 24505,
      "high": 24530,
      "low": 24500,
      "close": 24515,
      "volume": 95000
    }
  ],
  "strategy": {
    "strategyType": "INDICATOR_BASED",
    "instruments": ["NIFTY"],
    "legs": [
      {
        "qty": 50,
        "position": "BUY",
        "optionType": "CALL",
        "expiry": "WEEKLY",
        "strikeType": "ATM",
        "slType": "SL%",
        "sl": 5,
        "slOnPrice": "ENTRY",
        "tpType": "TP%",
        "tp": 10,
        "tpOnPrice": "ENTRY",
        "isActive": true
      },
      {
        "qty": 50,
        "position": "SELL",
        "optionType": "CALL",
        "expiry": "WEEKLY",
        "strikeType": "OTM_1",
        "slType": "SL%",
        "sl": 5,
        "slOnPrice": "ENTRY",
        "tpType": "TP%",
        "tp": 10,
        "tpOnPrice": "ENTRY",
        "isActive": true
      }
    ],
    "orderConfig": {
      "type": "MIS",
      "startTime": "09:16",
      "squareOff": "15:15",
      "activeDays": ["MON", "TUE", "WED", "THU", "FRI"]
    },
    "riskManagement": {
      "exitOnProfit": 1000,
      "exitOnLoss": -500,
      "noTradeAfter": "14:30",
      "profitTrailing": "TRAIL_PROFIT"
    },
    "advanceFeatures": {
      "moveSLtoCost": true,
      "exitAllOnSLTgt": false,
      "reEntryExecute": true,
      "trailSL": true
    }
  }
}
```

### RESPONSE

```json
{
  "pnl": 2500.5,
  "total_trades": 15,
  "win_rate": 73.33,
  "max_drawdown": -800,
  "trades": [
    {
      "entry_price": 1250,
      "exit_price": 1275,
      "profit": 25,
      "entry_time": "2025-03-30 09:45:00",
      "exit_time": "2025-03-30 10:15:00",
      "legs": [
        { "leg_id": 0, "qty": 50, "entry": 1250, "exit": 1275, "side": "BUY" },
        { "leg_id": 1, "qty": 50, "entry": 1240, "exit": 1265, "side": "SELL" }
      ]
    }
  ],
  "metrics": {
    "total_profit_trades": 11,
    "total_loss_trades": 4,
    "avg_profit": 275,
    "avg_loss": -195,
    "largest_gain": 500,
    "largest_loss": -350,
    "consecutive_wins": 5
  }
}
```

---

## Implementation Priority

### Must Have (MVP)

1. ✅ Strike selection engine
2. ✅ Multi-leg position manager
3. ✅ Time validation (trading hours)
4. ✅ SL/TP logic (percentage & points)
5. ✅ Global profit/loss limits
6. ✅ Trade result tracking

### Should Have (Phase 2)

1. Trailing stops
2. Multi-indicator support
3. Re-entry logic
4. Advanced feature handling
5. Max drawdown calculation

### Nice to Have (Phase 3)

1. Option Greeks calculation
2. Volatility surface consideration
3. Slippage modeling
4. Commission/Brokerage computation
5. Performance analytics (Sharpe ratio, etc.)

---

## Testing Requirements

Create tests for:

1. Strike selection (ATM, OTM levels)
2. Multi-leg P&L calculation
3. SL/TP triggering
4. Time validation (trading hours blocks)
5. Trailing stop logic
6. Edge cases (gap down/up, large moves, etc.)

---

## Data Requirements

For backtesting to work, you need:

- **OHLC candles** with timestamps
- **Strike step size** (e.g., NIFTY = 100, BANKNIFTY = 100, FINNIFTY = 50)
- **Option pricing model** (can start simple, use Black-Scholes later)
- **Spot price history** to determine strikes

---

## Questions to Clarify

1. **Option Pricing:** Should we use historical option prices or calculate with Black-Scholes?
2. **Spot vs Strike:** For strike selection, should we round to nearest step or use ATM as reference?
3. **Time Format:** What timezone for start/squareoff times?
4. **Partial Exits:** Support partial position exits or full exit only?
5. **Multiple Signals:** If BUY and SELL signals on same candle, which takes priority?

---

## File Structure (Recommended)

```
server/python-engine/
├── main.py
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── backtest_engine/
│   │   │   ├── __init__.py
│   │   │   ├── runner.py
│   │   ├── strike_engine.py
│   │   ├── position_manager.py
│   │   ├── execution_engine.py
│   │   ├── risk_engine.py
│   │   ├── advanced_features.py
│   │   ├── time_validator.py
│   ├── indicators/
│   │   ├── __init__.py
│   │   ├── momentum/
│   │   │   ├── __init__.py
│   │   │   ├── rsi.py
│   │   ├── trend/
│   │   │   ├── ema.py
│   │   │   ├── macd.py
│   │   ├── volatility/
│   │   │   ├── bollinger_bands.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── backtest.py
│   │   ├── health.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── backtest.py (EXPAND with full strategy config)
│   ├── models/
│   │   ├── position.py
│   │   ├── trade.py
│   │   ├── signal.py
├── tests/
│   ├── __init__.py
│   ├── test_strike_selection.py
│   ├── test_position_manager.py
│   ├── test_risk_management.py
│   ├── test_runner.py (enhance)
```

---

## Success Criteria

Engine is complete when:

- ✅ Can accept full strategy configuration (not just RSI)
- ✅ Generates strikes based on strikeType
- ✅ Tracks multi-leg positions accurately
- ✅ Respects time-based rules (no trades outside hours)
- ✅ Applies SL/TP correctly (entry vs current, % vs points)
- ✅ Handles trailing stops
- ✅ Exits on global profit/loss targets
- ✅ Returns detailed trade results with entry/exit times
- ✅ All tests passing
- ✅ Can backtest a complete strategy end-to-end
