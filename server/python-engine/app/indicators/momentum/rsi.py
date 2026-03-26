import pandas as pd


def calculate_rsi(
    close: pd.Series,
    period: int = 14,
) -> pd.Series:
    if close is None or len(close) < period:
        raise ValueError("Not enough data to calculate RSI")

    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / (avg_loss.replace(0, 1e-10))
    rsi = 100 - (100 / (1 + rs))

    return rsi
