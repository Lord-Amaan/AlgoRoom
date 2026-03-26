import pandas as pd
from fastapi import APIRouter, HTTPException

from app.engines.backtest_engine.runner import run_backtest
from app.schemas.backtest import BacktestRequest, BacktestResponse


router = APIRouter(prefix="/backtest")


@router.post("", response_model=BacktestResponse)
def backtest(request: BacktestRequest):
    """
    Run an RSI-based backtest over the provided candle series.
    """

    if not request.candles:
        raise HTTPException(status_code=400, detail="`candles` must be a non-empty list")

    # Convert payload to DataFrame for the backtest engine.
    df = pd.DataFrame([c.model_dump() for c in request.candles])

    if "close" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required candle field: `close`")

    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna(subset=["close"]).reset_index(drop=True)

    if df.empty:
        raise HTTPException(status_code=400, detail="`close` values must be valid numbers")

    try:
        results = run_backtest(
            df,
            rsi_period=request.rsi_period,
            buy_threshold=request.buy_threshold,
            sell_threshold=request.sell_threshold,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # Normalize to plain Python types to keep JSON serialization predictable.
    trades = []
    for t in results.get("trades", []):
        trades.append(
            {
                "entry_price": float(t["entry_price"]),
                "exit_price": float(t["exit_price"]),
                "profit": float(t["profit"]),
                "entry_time": t.get("entry_time"),
                "exit_time": t.get("exit_time"),
            }
        )

    return {
        "pnl": float(results["pnl"]),
        "total_trades": int(results["total_trades"]),
        "win_rate": float(results["win_rate"]),
        "max_drawdown": None,
        "trades": trades,
    }

