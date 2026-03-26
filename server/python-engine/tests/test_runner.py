import numpy as np
import pandas as pd

from app.engines.backtest_engine.runner import run_backtest


# Dummy data
np.random.seed(42)
data = pd.DataFrame({"close": np.random.uniform(100, 200, 100)})

result = run_backtest(data)

print(result)
