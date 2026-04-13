from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple


def _parse_time_sort_value(t: Dict[str, Any], key: str, fallback_key: str) -> Tuple[int, Any]:
    """Return (0, int) for numeric sort, (1, str) for ISO fallback."""
    v = t.get(key)
    if v is not None:
        try:
            return (0, int(v))
        except (TypeError, ValueError):
            pass
    s = t.get(fallback_key)
    if s is None:
        return (2, "")
    if isinstance(s, (int, float)):
        return (0, int(s))
    try:
        iso = str(s).replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (0, int(dt.timestamp()))
    except (ValueError, TypeError, OSError, OverflowError):
        return (1, str(s))


def trade_sort_key(t: Dict[str, Any]) -> Tuple:
    """
    Deterministic ordering: exit time ascending, then entry time, then id.
    Matches equity curve and drawdown computation.
    """
    ex = _parse_time_sort_value(t, "exit_time_sort", "exit_time")
    en = _parse_time_sort_value(t, "entry_time_sort", "entry_time")
    tid = str(t.get("id", ""))
    return (ex, en, tid)


def sort_trades_for_analytics(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(trades, key=trade_sort_key)


def equity_path_and_drawdown(trades: List[Dict[str, Any]]) -> Tuple[List[float], float, float]:
    """
    Build cumulative equity (starting at 0, after each trade in exit-time order).
    Returns:
      equity_after_each: length len(trades), cumulative after each closed trade
      max_drawdown: negative currency (largest peak-to-trough decline)
      max_drawdown_pct: percent relative to equity peak at max drawdown episode
    """
    ordered = sort_trades_for_analytics(trades)
    equity_after_each: List[float] = []
    eq = 0.0
    peak = 0.0
    max_dd_mag = 0.0
    peak_ref = 0.0
    for t in ordered:
        eq += float(t.get("pnl", 0.0) or 0.0)
        equity_after_each.append(eq)
        peak = max(peak, eq)
        dd = peak - eq
        if dd > max_dd_mag:
            max_dd_mag = dd
            peak_ref = peak
    max_drawdown = -round(max_dd_mag, 8) if max_dd_mag else 0.0
    max_drawdown_pct = round((max_dd_mag / peak_ref * 100.0), 8) if peak_ref > 0 else 0.0
    return equity_after_each, max_drawdown, max_drawdown_pct
