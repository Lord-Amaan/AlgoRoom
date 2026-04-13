import numpy as np
import pandas as pd

from app.engines.raptor_runner import run_raptor_engine


def test_run_raptor_engine_sma_path_deterministic():
    np.random.seed(0)
    n = 80
    close = 100 + np.cumsum(np.random.randn(n))
    df = pd.DataFrame(
        {
            "timestamp": pd.date_range("2024-01-02 09:20", periods=n, freq="min"),
            "open": close,
            "high": close + 0.5,
            "low": close - 0.5,
            "close": close,
            "volume": np.ones(n) * 1e6,
        }
    )
    strat = {
        "strategyType": "INDICATOR_BASED",
        "legs": [{"position": "BUY", "isActive": True, "qty": 1}],
        "instruments": ["NIFTY"],
    }
    r1 = run_raptor_engine(df, strat)
    r2 = run_raptor_engine(df, strat)
    assert r1["summary"]["total_trades"] == r2["summary"]["total_trades"]
    assert r1["summary"]["total_pnl"] == r2["summary"]["total_pnl"]
    assert "equity_curve" in r1
    assert "daily_pnl" in r1
    assert "calendar" in r1
    assert "advanced_metrics" in r1


def test_run_raptor_engine_empty_df():
    df = pd.DataFrame({"timestamp": [], "open": [], "high": [], "low": [], "close": [], "volume": []})
    r = run_raptor_engine(df, {"legs": [{"position": "BUY"}]})
    assert r["trades"] == []
    assert r["summary"]["total_trades"] == 0
