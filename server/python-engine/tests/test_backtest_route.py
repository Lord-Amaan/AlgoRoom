from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_post_backtest_returns_full_payload():
    payload = {
        "candles": [
            {
                "timestamp": "2024-01-02 09:20:00",
                "open": 100.0,
                "high": 101.0,
                "low": 99.0,
                "close": 100.5,
                "volume": 1_000_000.0,
            },
            {
                "timestamp": "2024-01-02 09:21:00",
                "open": 100.5,
                "high": 102.0,
                "low": 100.0,
                "close": 101.0,
                "volume": 1_000_000.0,
            },
        ],
        "strategy": {
            "strategyType": "TIME_BASED",
            "instruments": ["NIFTY"],
            "legs": [{"position": "BUY", "qty": 1, "isActive": True}],
            "orderConfig": {
                "startTime": "09:16",
                "squareOff": "09:21",
                "activeDays": ["TUE"],
            },
        },
    }
    resp = client.post("/backtest", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    for key in (
        "summary",
        "equity_curve",
        "daily_pnl",
        "calendar",
        "advanced_metrics",
        "trades",
        "pnl",
        "total_trades",
        "win_rate",
        "max_drawdown",
    ):
        assert key in data
