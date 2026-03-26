import pandas as pd

from app.indicators.momentum.rsi import calculate_rsi


data = pd.Series(
    [100, 102, 101, 105, 107, 103, 100, 98, 95, 97, 99, 101, 103, 105, 108]
)

rsi = calculate_rsi(data)

print(rsi.tail())
