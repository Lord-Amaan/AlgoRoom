from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CandleData(BaseModel):
    """
    OHLC candle used for backtesting.

    `runner.run_backtest` currently requires only `close`, but this schema
    accepts a full OHLC payload for future strategy/feature expansion.
    """

    timestamp: Optional[str] = None
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = None


class BacktestRequest(BaseModel):
    """
    Backtest request payload.

    `strategy` is included for forward compatibility; the current engine
    runs RSI-only logic.
    """

    candles: List[CandleData]
    strategy: Dict[str, Any] = Field(default_factory=dict)
    rsi_period: int = 14
    buy_threshold: float = 45
    sell_threshold: float = 55


class TradeResult(BaseModel):
    entry_price: float
    exit_price: float
    profit: float
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None


class BacktestResponse(BaseModel):
    pnl: float
    total_trades: int
    win_rate: float
    # Optional for compatibility with future metrics; current runner returns
    # only pnl/total_trades/win_rate/trades.
    max_drawdown: Optional[float] = None
    trades: List[TradeResult]