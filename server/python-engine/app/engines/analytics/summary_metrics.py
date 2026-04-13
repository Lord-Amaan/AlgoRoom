from __future__ import annotations

from typing import Any, Dict, List

from app.engines.analytics.common import equity_path_and_drawdown, sort_trades_for_analytics


def calculate_summary_metrics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministic summary from closed trades (each must have numeric 'pnl').
    max_drawdown is currency (negative rupee amount for peak-to-trough decline).
    max_drawdown_pct matches equity path (same exit-time order as equity_curve).
    """
    if not trades:
        return {
            "total_pnl": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "breakeven_trades": 0,
            "win_rate": 0.0,
            "avg_win": 0.0,
            "avg_loss": 0.0,
            "largest_win": 0.0,
            "largest_loss": 0.0,
            "profit_factor": 0.0,
            "max_drawdown": 0.0,
            "max_drawdown_pct": 0.0,
        }

    ordered = sort_trades_for_analytics(trades)
    pnls = [float(t.get("pnl", 0.0) or 0.0) for t in ordered]
    total_pnl = sum(pnls)
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p < 0]
    flat = sum(1 for p in pnls if p == 0)
    n = len(pnls)

    gross_profit = sum(wins) if wins else 0.0
    gross_loss = abs(sum(losses)) if losses else 0.0
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (float("inf") if gross_profit > 0 else 0.0)
    if profit_factor == float("inf"):
        profit_factor = 999_999.99  # JSON-safe sentinel

    _, max_dd_currency, max_dd_pct = equity_path_and_drawdown(trades)

    return {
        "total_pnl": round(total_pnl, 8),
        "total_trades": n,
        "winning_trades": len(wins),
        "losing_trades": len(losses),
        "breakeven_trades": flat,
        "win_rate": round((len(wins) / n) * 100.0, 4) if n else 0.0,
        "avg_win": round(sum(wins) / len(wins), 8) if wins else 0.0,
        "avg_loss": round(sum(losses) / len(losses), 8) if losses else 0.0,
        "largest_win": round(max(wins), 8) if wins else 0.0,
        "largest_loss": round(min(losses), 8) if losses else 0.0,
        "profit_factor": round(float(profit_factor), 8),
        "max_drawdown": float(max_dd_currency),
        "max_drawdown_pct": float(max_dd_pct),
    }
