from pydantic import BaseModel
from typing import List, Optional


class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float


# ---------- LEGS ----------
class Leg(BaseModel):
    qty: Optional[int] = None
    position: Optional[str] = None  # BUY / SELL
    optionType: Optional[str] = None  # CALL / PUT
    expiry: Optional[str] = None
    strikeType: Optional[str] = None
    isActive: Optional[bool] = True

    slType: Optional[str] = None
    sl: Optional[float] = None
    tpType: Optional[str] = None
    tp: Optional[float] = None


# ---------- ORDER CONFIG ----------
class OrderConfig(BaseModel):
    type: Optional[str] = None
    startTime: Optional[str] = None
    squareOff: Optional[str] = None
    activeDays: Optional[List[str]] = None


# ---------- RISK ----------
class RiskManagement(BaseModel):
    exitOnProfit: Optional[float] = None
    exitOnLoss: Optional[float] = None
    noTradeAfter: Optional[str] = None


# ---------- STRATEGY ----------
class Strategy(BaseModel):
    strategyType: Optional[str] = None
    instruments: Optional[List[str]] = None

    # RSI params (YOU WILL USE THESE)
    rsi_period: Optional[int] = 14
    buy_threshold: Optional[float] = 45
    sell_threshold: Optional[float] = 55

    legs: Optional[List[Leg]] = []
    orderConfig: Optional[OrderConfig] = None
    riskManagement: Optional[RiskManagement] = None


class BacktestRequest(BaseModel):
    candles: List[Candle]
    strategy: Strategy