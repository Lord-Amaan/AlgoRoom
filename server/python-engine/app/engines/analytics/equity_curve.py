from __future__ import annotations

from typing import Any, Dict, List

from app.engines.analytics.common import sort_trades_for_analytics


def calculate_equity_curve(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cumulative PnL after each closed trade, ordered by exit time (same order as drawdown).
    """
    if not trades:
        return []

    ordered = sort_trades_for_analytics(trades)
    cumulative = 0.0
    curve: List[Dict[str, Any]] = []
    for t in ordered:
        pnl = float(t.get("pnl", 0.0) or 0.0)
        cumulative += pnl
        curve.append(
            {
                "trade_id": t.get("id"),
                "exit_time": t.get("exit_time"),
                "cumulative_pnl": round(cumulative, 8),
                "trade_pnl": round(pnl, 8),
            }
        )
    return curve
