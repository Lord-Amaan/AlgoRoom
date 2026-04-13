from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _exit_date_key(trade: Dict[str, Any]) -> Optional[str]:
    ts = trade.get("exit_time_sort")
    if ts is None:
        return None
    try:
        if isinstance(ts, (int, float)):
            # unix seconds
            dt = datetime.fromtimestamp(int(ts), tz=timezone.utc)
        else:
            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, OSError, TypeError, OverflowError):
        return None


def calculate_daily_pnl(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate PnL by calendar day (UTC) of exit.
    Returns daily_pnl_list and a nested calendar: { "YYYY-MM": { "DD": pnl } }.
    """
    daily: Dict[str, float] = defaultdict(float)
    for t in trades:
        key = _exit_date_key(t)
        if not key:
            continue
        daily[key] += float(t.get("pnl", 0.0) or 0.0)

    daily_pnl_list = [
        {"date": d, "pnl": round(daily[d], 8)}
        for d in sorted(daily.keys())
    ]

    calendar: Dict[str, Dict[str, float]] = defaultdict(dict)
    for d, pnl in daily.items():
        parts = d.split("-")
        if len(parts) != 3:
            continue
        y, m, day = parts[0], parts[1], parts[2]
        month_key = f"{y}-{m}"
        calendar[month_key][str(int(day))] = round(pnl, 8)

    return {
        "daily_pnl_list": daily_pnl_list,
        "calendar": {k: dict(sorted(v.items(), key=lambda x: int(x[0]))) for k, v in sorted(calendar.items())},
    }
