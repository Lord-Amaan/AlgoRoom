from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class Leg(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    qty: Optional[int] = None
    position: Optional[str] = None  # BUY / SELL
    optionType: Optional[str] = None
    expiry: Optional[str] = None
    strikeType: Optional[str] = None
    isActive: Optional[bool] = True

    slType: Optional[str] = None
    sl: Optional[float] = None
    tpType: Optional[str] = None
    tp: Optional[float] = None


class OrderConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    type: Optional[str] = None
    startTime: Optional[str] = None
    squareOff: Optional[str] = None
    activeDays: Optional[List[str]] = None


class RiskManagement(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    exitOnProfit: Optional[float] = None
    exitOnLoss: Optional[float] = None
    noTradeAfter: Optional[str] = None


class Strategy(BaseModel):
    """Rich strategy payload from Node; unknown keys are passed through on dump."""

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    strategyType: Optional[str] = None
    instruments: Optional[List[str]] = None
    legs: Optional[List[Leg]] = None
    orderConfig: Optional[OrderConfig] = None
    riskManagement: Optional[RiskManagement] = None
    advanceFeatures: Optional[Dict[str, Any]] = None


class BacktestRequest(BaseModel):
    candles: List[Candle]
    strategy: Optional[Strategy] = None


class BacktestResponse(BaseModel):
    """Full analytics payload plus legacy flat fields for existing API clients."""

    summary: Dict[str, Any]
    equity_curve: List[Dict[str, Any]]
    daily_pnl: List[Dict[str, Any]]
    calendar: Dict[str, Any]
    advanced_metrics: Dict[str, Any]
    trades: List[Dict[str, Any]]

    pnl: float
    total_trades: int
    win_rate: float
    max_drawdown: float
