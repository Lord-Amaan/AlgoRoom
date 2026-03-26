import pandas as pd

from app.indicators.momentum.rsi import calculate_rsi


def run_backtest(
    df: pd.DataFrame,
    rsi_period: int = 14,
    buy_threshold=45,
    sell_threshold=55,
):
#  Validating the dataframe
    if "close" not in df.columns:
        raise ValueError("DataFrame must contain 'close' column")

    df = df.copy()
#  Calculating the RSI
    df["rsi"] = calculate_rsi(df["close"], period=rsi_period)

    # Remove NaN rows
    df = df.dropna().reset_index(drop=True)

#  Generating the signals
    df["signal"] = "HOLD"

    df.loc[df["rsi"] < buy_threshold, "signal"] = "BUY"
    df.loc[df["rsi"] > sell_threshold, "signal"] = "SELL"

#  Simulating the trades
    position = "LONG"
    entry_price = df.iloc[0]["close"]
    trades = []
    pnl = 0
    wins = 0

    for i in range(len(df)):
        row = df.iloc[i]
        price = row["close"]
        signal = row["signal"]

        # BUY
        if signal == "BUY" and position is None:
            position = "LONG"
            entry_price = price

        # SELL
        elif signal == "SELL" and position == "LONG" and i > 0:
            exit_price = price
            profit = exit_price - entry_price

            pnl += profit

            trades.append(
                {
                    "entry_price": float(entry_price),
                    "exit_price": float(exit_price),
                    "profit": float(profit),
                }
            )

            if profit > 0:
                wins += 1

            position = None
#  Calculating the metrics
    total_trades = len(trades)
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
    print(df["signal"].value_counts())
    return {
        "pnl": float(round(pnl, 2)),
        "total_trades": int(total_trades),
        "win_rate": float(round(win_rate, 2)),
        "trades": trades,
    }
