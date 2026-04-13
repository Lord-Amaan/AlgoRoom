import pandas as pd
from fastapi import APIRouter, HTTPException

from app.engines.raptor_runner import run_raptor_engine
from app.schemas.backtest import BacktestRequest, BacktestResponse

router = APIRouter(prefix="/backtest")


@router.post("", response_model=BacktestResponse)
def backtest(request: BacktestRequest):
    """
    Run a RaptorBT backtest on the provided candle series and return analytics.
    """

    if not request.candles:
        raise HTTPException(status_code=400, detail="`candles` must be a non-empty list")

    df = pd.DataFrame([c.model_dump() for c in request.candles])

    if "close" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required candle field: `close`")

    for col in ("open", "high", "low", "close", "volume"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["close"]).reset_index(drop=True)

    if df.empty:
        raise HTTPException(status_code=400, detail="`close` values must be valid numbers")

<<<<<<< Updated upstream
    # 🔥 NEW: Extract strategy (SAFE DEFAULTS)
    strategy = request.strategy or {}

    rsi_period = strategy.get("rsi_period", request.rsi_period)
    buy_threshold = strategy.get("buy_threshold", request.buy_threshold)
    sell_threshold = strategy.get("sell_threshold", request.sell_threshold)
=======
    strategy_dict: dict = {}
    if request.strategy:
        strategy_dict = (
            request.strategy.model_dump()
            if hasattr(request.strategy, "model_dump")
            else request.strategy.dict()
        )
>>>>>>> Stashed changes

    try:
        results = run_raptor_engine(df, strategy_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    summary = results.get("summary") or {}
    advanced = results.get("advanced_metrics") or {}

    legacy_pnl = float(summary.get("total_pnl", 0.0) or 0.0)
    legacy_trades = int(summary.get("total_trades", 0) or 0)
    legacy_win_rate = float(summary.get("win_rate", 0.0) or 0.0)
    legacy_dd = float(summary.get("max_drawdown", 0.0) or 0.0)

    return {
        "summary": results["summary"],
        "equity_curve": results["equity_curve"],
        "daily_pnl": results["daily_pnl"],
        "calendar": results["calendar"],
        "advanced_metrics": results["advanced_metrics"],
        "trades": results["trades"],
        "pnl": legacy_pnl,
        "total_trades": legacy_trades,
        "win_rate": legacy_win_rate,
        "max_drawdown": legacy_dd,
    }
