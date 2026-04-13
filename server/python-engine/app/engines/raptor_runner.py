from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd
import raptorbt

from app.engines.analytics.advanced_metrics import calculate_advanced_metrics
from app.engines.analytics.daily_pnl import calculate_daily_pnl
from app.engines.analytics.equity_curve import calculate_equity_curve
from app.engines.analytics.summary_metrics import calculate_summary_metrics

WEEKDAY_CODE: Tuple[str, ...] = ("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")
DEFAULT_ACTIVE: Set[str] = {"MON", "TUE", "WED", "THU", "FRI"}


def _json_safe(obj: Any) -> Any:
    """Recursively replace non-finite floats for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


def _parse_hhmm(value: Optional[str], default: str) -> int:
    raw = (value or default).strip()
    parts = raw.split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    return h * 60 + m


def _first_active_leg(legs: List[Dict[str, Any]]) -> Dict[str, Any]:
    for leg in legs or []:
        if leg.get("isActive", True) is False:
            continue
        return leg
    return {}


def _direction_from_legs(legs: List[Dict[str, Any]]) -> int:
    leg = _first_active_leg(legs)
    pos = (leg.get("position") or "BUY").upper()
    return -1 if pos == "SELL" else 1


def _ensure_timestamps(df: pd.DataFrame) -> pd.Series:
    if "timestamp" in df.columns:
        return pd.to_datetime(df["timestamp"], errors="coerce")
    if isinstance(df.index, pd.DatetimeIndex):
        return pd.Series(df.index, index=df.index)
    raise ValueError("DataFrame must contain a 'timestamp' column or a DatetimeIndex")


def _session_signals(
    ts: pd.Series,
    active_days: Set[str],
    start_hm: int,
    square_hm: int,
) -> Tuple[np.ndarray, np.ndarray]:
    n = len(ts)
    entries = np.zeros(n, dtype=np.bool_)
    exits = np.zeros(n, dtype=np.bool_)
    if n == 0:
        return entries, exits

    by_date: Dict[Any, List[int]] = {}
    for i in range(n):
        t = ts.iloc[i]
        if pd.isna(t):
            continue
        d = t.date()
        by_date.setdefault(d, []).append(i)

    for d in sorted(by_date.keys()):
        idxs = by_date[d]
        t0 = ts.iloc[idxs[0]]
        if pd.isna(t0):
            continue
        code = WEEKDAY_CODE[int(t0.weekday())]
        if code not in active_days:
            continue
        entry_idx: Optional[int] = None
        exit_idx: Optional[int] = None
        for i in idxs:
            t = ts.iloc[i]
            if pd.isna(t):
                continue
            hm = int(t.hour) * 60 + int(t.minute)
            if entry_idx is None and hm >= start_hm:
                entry_idx = i
            if hm >= square_hm:
                exit_idx = i
                break
        if entry_idx is None or exit_idx is None:
            continue
        if exit_idx <= entry_idx:
            continue
        entries[entry_idx] = True
        exits[exit_idx] = True
    return entries, exits


def _sma_cross_signals(close: np.ndarray, fast: int, slow: int) -> Tuple[np.ndarray, np.ndarray]:
    n = len(close)
    entries = np.zeros(n, dtype=np.bool_)
    exits = np.zeros(n, dtype=np.bool_)
    if n < slow + 1:
        return entries, exits
    c = close.astype(np.float64)
    f = np.asarray(raptorbt.sma(c, fast), dtype=np.float64)
    s = np.asarray(raptorbt.sma(c, slow), dtype=np.float64)
    for i in range(1, n):
        if any(np.isnan([f[i], s[i], f[i - 1], s[i - 1]])):
            continue
        if f[i] > s[i] and f[i - 1] <= s[i - 1]:
            entries[i] = True
        if f[i] < s[i] and f[i - 1] >= s[i - 1]:
            exits[i] = True
    return entries, exits


def _build_signals(df: pd.DataFrame, strategy_dict: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
    ts = _ensure_timestamps(df)
    stype = (strategy_dict.get("strategyType") or strategy_dict.get("strategy_type") or "").upper()
    oc = strategy_dict.get("orderConfig") or strategy_dict.get("order_config") or {}
    has_schedule = bool(oc.get("startTime") or oc.get("squareOff") or oc.get("start_time") or oc.get("square_off"))

    active_raw = oc.get("activeDays") or oc.get("active_days") or list(DEFAULT_ACTIVE)
    active_days = {str(x).upper()[:3] if len(str(x)) > 3 else str(x).upper() for x in active_raw}
    # Normalize full day names
    day_aliases = {
        "MONDAY": "MON",
        "TUESDAY": "TUE",
        "WEDNESDAY": "WED",
        "THURSDAY": "THU",
        "FRIDAY": "FRI",
        "SATURDAY": "SAT",
        "SUNDAY": "SUN",
    }
    active_days = {day_aliases.get(d, d) for d in active_days}

    start_hm = _parse_hhmm(oc.get("startTime") or oc.get("start_time"), "09:16")
    square_hm = _parse_hhmm(oc.get("squareOff") or oc.get("square_off"), "15:15")

    if stype == "TIME_BASED" or (stype == "STOCKS_FUTURES" and has_schedule) or (has_schedule and stype != "INDICATOR_BASED"):
        return _session_signals(ts, active_days if active_days else DEFAULT_ACTIVE, start_hm, square_hm)

    if stype == "INDICATOR_BASED" or stype == "STOCKS_FUTURES":
        close = df["close"].to_numpy(dtype=np.float64)
        return _sma_cross_signals(close, fast=5, slow=20)

    # Default: session if we have any order config keys, else SMA
    if oc:
        return _session_signals(ts, active_days if active_days else DEFAULT_ACTIVE, start_hm, square_hm)
    close = df["close"].to_numpy(dtype=np.float64)
    return _sma_cross_signals(close, fast=5, slow=20)


def _apply_leg_risk(cfg: raptorbt.PyBacktestConfig, leg: Dict[str, Any], ref_price: float) -> None:
    if ref_price <= 0:
        return
    sl_type = leg.get("slType") or leg.get("sl_type")
    sl_val = leg.get("sl")
    if sl_type and sl_val is not None:
        if str(sl_type).upper().startswith("SL%"):
            cfg.set_fixed_stop(float(sl_val))
        elif "POINT" in str(sl_type).upper():
            cfg.set_fixed_stop(float(sl_val) / ref_price * 100.0)

    tp_type = leg.get("tpType") or leg.get("tp_type")
    tp_val = leg.get("tp")
    if tp_type and tp_val is not None:
        if str(tp_type).upper().startswith("TP%"):
            cfg.set_fixed_target(float(tp_val))
        elif "POINT" in str(tp_type).upper():
            cfg.set_fixed_target(float(tp_val) / ref_price * 100.0)


def _unix_to_iso(ts: int) -> str:
    return datetime.fromtimestamp(int(ts), tz=timezone.utc).isoformat()


def _py_trades_to_analytics_rows(py_trades: List[Any]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for t in py_trades:
        et = int(t.entry_time)
        xt = int(t.exit_time)
        pnl = float(t.pnl)
        row = {
            "id": int(t.id),
            "legIndex": 0,
            "symbol": str(t.symbol),
            "direction": int(t.direction),
            "entry_price": float(t.entry_price),
            "exit_price": float(t.exit_price),
            "entry_idx": int(t.entry_idx),
            "exit_idx": int(t.exit_idx),
            "entry_time_sort": et,
            "exit_time_sort": xt,
            "entry_time": _unix_to_iso(et),
            "exit_time": _unix_to_iso(xt),
            "pnl": pnl,
            "profit": pnl,
            "return_pct": float(t.return_pct),
            "size": float(t.size),
            "fees": float(t.fees),
            "exit_reason": str(t.exit_reason),
        }
        rows.append(row)
    return rows


def _api_trades_from_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Snake_case fields expected by Node controller mapping."""
    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "legIndex": r.get("legIndex", 0),
                "entry_price": r["entry_price"],
                "exit_price": r["exit_price"],
                "entry_time": r["entry_time"],
                "exit_time": r["exit_time"],
                "profit": r["pnl"],
                "pnl": r["pnl"],
                "return_pct": r.get("return_pct"),
                "direction": r.get("direction"),
                "symbol": r.get("symbol"),
                "exit_reason": r.get("exit_reason"),
                "id": r.get("id"),
            }
        )
    return out


def run_raptor_engine(df: pd.DataFrame, strategy_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute RaptorBT on OHLCV (+ timestamp) and enrich with analytics.
    Strategy interpretation:
      - TIME_BASED (or scheduled STOCKS_FUTURES): intraday entry / square-off windows.
      - INDICATOR_BASED (or unscheduled STOCKS_FUTURES): deterministic SMA(5)/SMA(20) cross (not RSI).
    """
    if df.empty or "close" not in df.columns:
        empty_rows: List[Dict[str, Any]] = []
        summary = calculate_summary_metrics(empty_rows)
        summary["raptor_metrics"] = {}
        daily_data = calculate_daily_pnl(empty_rows)
        return {
            "summary": summary,
            "equity_curve": [],
            "daily_pnl": daily_data["daily_pnl_list"],
            "calendar": daily_data["calendar"],
            "advanced_metrics": calculate_advanced_metrics(empty_rows),
            "trades": [],
        }

    df = df.reset_index(drop=True)
    ts_series = _ensure_timestamps(df)
    if ts_series.isna().all():
        raise ValueError("All timestamps are invalid")

    unix = (ts_series.astype("int64").to_numpy() // 10**9).astype(np.int64)
    o = df["open"].to_numpy(dtype=np.float64) if "open" in df.columns else df["close"].to_numpy(dtype=np.float64)
    h = df["high"].to_numpy(dtype=np.float64) if "high" in df.columns else df["close"].to_numpy(dtype=np.float64)
    low = df["low"].to_numpy(dtype=np.float64) if "low" in df.columns else df["close"].to_numpy(dtype=np.float64)
    c = df["close"].to_numpy(dtype=np.float64)
    if "volume" in df.columns:
        v = df["volume"].to_numpy(dtype=np.float64)
    else:
        v = np.ones(len(df), dtype=np.float64)

    entries, exits = _build_signals(df, strategy_dict)
    direction = _direction_from_legs(strategy_dict.get("legs") or [])

    legs = strategy_dict.get("legs") or []
    leg = _first_active_leg(legs)
    ref_price = float(np.nanmean(c)) if len(c) else 0.0

    initial_capital = float(strategy_dict.get("initial_capital") or strategy_dict.get("initialCapital") or 100_000)
    fees = float(strategy_dict.get("fees") or 0.0)
    slippage = float(strategy_dict.get("slippage") or 0.0)

    cfg = raptorbt.PyBacktestConfig(initial_capital=initial_capital, fees=fees, slippage=slippage)
    _apply_leg_risk(cfg, leg, ref_price)

    ic: Optional[raptorbt.PyInstrumentConfig] = None
    qty = leg.get("qty")
    if qty is not None and int(qty) > 0:
        ic = raptorbt.PyInstrumentConfig(lot_size=int(qty))

    instruments = strategy_dict.get("instruments") or []
    symbol = str(instruments[0]) if instruments else "UNDERLYING"

    result = raptorbt.run_single_backtest(
        unix,
        o,
        h,
        low,
        c,
        v,
        entries,
        exits,
        direction,
        1.0,
        symbol,
        cfg,
        None,
        ic,
    )

    py_trades = list(result.trades())
    analytics_rows = _py_trades_to_analytics_rows(py_trades)

    summary = calculate_summary_metrics(analytics_rows)
    equity_curve = calculate_equity_curve(analytics_rows)
    daily_data = calculate_daily_pnl(analytics_rows)
    advanced = calculate_advanced_metrics(analytics_rows)

    api_trades = _api_trades_from_rows(analytics_rows)

    # RaptorBT engine metrics (deterministic) — attach for transparency
    metrics_dict: Dict[str, Any] = {}
    try:
        metrics_dict = _json_safe(result.metrics.to_dict())
    except Exception:
        metrics_dict = {}

    summary = {
        **summary,
        "raptor_metrics": metrics_dict,
    }

    return {
        "summary": summary,
        "equity_curve": equity_curve,
        "daily_pnl": daily_data["daily_pnl_list"],
        "calendar": daily_data["calendar"],
        "advanced_metrics": advanced,
        "trades": api_trades,
    }
