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


def test_run_raptor_engine_time_based_golden_case():
    df = pd.DataFrame(
        [
            {"timestamp": "2026-04-14 09:16:00", "open": 100, "high": 101, "low": 99, "close": 100, "volume": 10},
            {"timestamp": "2026-04-14 09:17:00", "open": 100, "high": 102, "low": 99, "close": 101, "volume": 11},
            {"timestamp": "2026-04-14 09:18:00", "open": 101, "high": 103, "low": 100, "close": 102, "volume": 12},
            {"timestamp": "2026-04-14 09:19:00", "open": 102, "high": 104, "low": 101, "close": 103, "volume": 13},
        ]
    )
    strat = {
        "strategyType": "TIME_BASED",
        "legs": [{"position": "BUY", "isActive": True, "qty": 1}],
        "instruments": ["NIFTY"],
        "orderConfig": {
            "startTime": "09:16",
            "squareOff": "09:18",
            "activeDays": ["TUE"],
        },
    }

    result = run_raptor_engine(df, strat)

    assert result["summary"]["total_trades"] == 1
    assert result["summary"]["total_pnl"] == 2000.0
    assert result["summary"]["winning_trades"] == 1
    assert result["summary"]["max_drawdown"] == 0.0
    assert result["daily_pnl"] == [{"date": "2026-04-14", "pnl": 2000.0}]
    assert result["calendar"] == {"2026-04": {"14": 2000.0}}

    assert len(result["trades"]) == 1
    trade = result["trades"][0]
    assert trade["entry_time"] == "2026-04-14T03:46:00+00:00"
    assert trade["exit_time"] == "2026-04-14T03:48:00+00:00"
    assert trade["entry_price"] == 100.0
    assert trade["exit_price"] == 102.0
    assert trade["pnl"] == 2000.0
    assert trade["return_pct"] == 2.0
