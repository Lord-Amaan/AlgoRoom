from __future__ import annotations

import math
from typing import Any, Dict, List

from app.engines.analytics.common import equity_path_and_drawdown, sort_trades_for_analytics


def calculate_advanced_metrics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministic trade-level metrics (no randomization).
    Uses per-trade return_pct when present, else derives from prices.
    """
    if not trades:
        return {
            "expectancy": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "max_drawdown": 0.0,
            "max_drawdown_pct": 0.0,
            "recovery_factor": 0.0,
            "payoff_ratio": 0.0,
        }

    rets: List[float] = []
    for t in trades:
        rp = t.get("return_pct")
        if rp is not None:
            rets.append(float(rp))
            continue
        ep = float(t.get("entry_price", 0.0) or 0.0)
        xp = float(t.get("exit_price", 0.0) or 0.0)
        direction = float(t.get("direction", 1) or 1)
        if ep == 0:
            rets.append(0.0)
        else:
            rets.append(direction * (xp - ep) / ep * 100.0)

    n = len(rets)
    mean_r = sum(rets) / n
    expectancy = mean_r

    def _std(xs: List[float], ddof: int = 1) -> float:
        if len(xs) <= ddof:
            return 0.0
        m = sum(xs) / len(xs)
        var = sum((x - m) ** 2 for x in xs) / (len(xs) - ddof)
        return math.sqrt(var) if var > 0 else 0.0

    std_all = _std(rets, 1)
    neg = [r for r in rets if r < 0]
    std_down = _std(neg, 1) if len(neg) > 1 else (abs(min(neg)) if neg else 0.0)

    sharpe = (mean_r / std_all) if std_all > 0 else 0.0
    sortino = (mean_r / std_down) if std_down > 0 else 0.0

    ordered = sort_trades_for_analytics(trades)
    _, max_dd_currency, max_dd_pct = equity_path_and_drawdown(trades)
    max_dd_mag = abs(float(max_dd_currency)) if max_dd_currency else 0.0

    total_pnl = sum(float(t.get("pnl", 0.0) or 0.0) for t in ordered)
    recovery_factor = (total_pnl / max_dd_mag) if max_dd_mag > 0 else (999_999.99 if total_pnl > 0 else 0.0)
    if recovery_factor > 999_999.99:
        recovery_factor = 999_999.99

    wins = [r for r in rets if r > 0]
    losses = [r for r in rets if r < 0]
    avg_win = sum(wins) / len(wins) if wins else 0.0
    avg_loss = abs(sum(losses) / len(losses)) if losses else 0.0
    payoff = (avg_win / avg_loss) if avg_loss > 0 else 0.0

    return {
        "expectancy": round(expectancy, 8),
        "sharpe_ratio": round(sharpe, 8),
        "sortino_ratio": round(sortino, 8),
        "max_drawdown": round(float(max_dd_currency), 8),
        "max_drawdown_pct": round(float(max_dd_pct), 8),
        "recovery_factor": round(recovery_factor, 8),
        "payoff_ratio": round(payoff, 8),
    }
