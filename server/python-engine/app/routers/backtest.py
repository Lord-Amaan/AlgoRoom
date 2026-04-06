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

    # ✅ Validate candles
    if not request.candles:
        raise HTTPException(status_code=400, detail="`candles` must be a non-empty list")

    # ✅ Convert to DataFrame
    df = pd.DataFrame([c.model_dump() for c in request.candles])

    if "close" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required candle field: `close`")

    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna(subset=["close"]).reset_index(drop=True)

    if df.empty:
        raise HTTPException(status_code=400, detail="`close` values must be valid numbers")

    # 🔥 NEW: Extract strategy (SAFE DEFAULTS)
    strategy_dict = {}
    if request.strategy:
        # Convert Pydantic model to dictionary
        strategy_dict = request.strategy.model_dump() if hasattr(request.strategy, 'model_dump') else request.strategy.dict()

    # Use defaults for RSI parameters (basic strategy)
    rsi_period = strategy_dict.get("rsi_period", getattr(request, "rsi_period", 14))
    buy_threshold = strategy_dict.get("buy_threshold", getattr(request, "buy_threshold", 45))
    sell_threshold = strategy_dict.get("sell_threshold", getattr(request, "sell_threshold", 55))

    try:
        results = run_backtest(
            df,
            rsi_period=rsi_period,
            buy_threshold=buy_threshold,
            sell_threshold=sell_threshold,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # ✅ Normalize trades
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