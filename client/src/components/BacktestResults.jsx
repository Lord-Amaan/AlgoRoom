function formatInr(value) {
  if (value == null || Number.isNaN(Number(value))) return '₹ 0.00';
  const n = Number(value);
  const formatted = Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (n < 0) return `₹ -${formatted}`;
  return `₹ ${formatted}`;
}

export default function BacktestResults({ summary, createdAt, strategyLabel }) {
  if (!summary || typeof summary !== 'object') {
    return (
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-semibold mb-4">Backtest Results</h3>
        <p className="text-dark-500 text-sm">
          Results will be displayed here after running a backtest.
        </p>
      </div>
    );
  }

  const totalPnl = summary.total_pnl ?? 0;
  const winRate = summary.win_rate ?? 0;
  const totalTrades = summary.total_trades ?? 0;
  const maxDd = summary.max_drawdown ?? 0;
  const maxDdPct = summary.max_drawdown_pct;

  const metrics = [
    {
      label: 'Total P&L',
      value: formatInr(totalPnl),
      color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: totalPnl >= 0 ? 'bg-green-900 bg-opacity-20' : 'bg-red-900 bg-opacity-20',
    },
    {
      label: 'Win Rate',
      value: `${Number(winRate).toFixed(2)}%`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900 bg-opacity-20',
    },
    {
      label: 'Total Trades',
      value: String(totalTrades),
      color: 'text-purple-400',
      bgColor: 'bg-purple-900 bg-opacity-20',
    },
    {
      label: 'Max Drawdown',
      value: formatInr(maxDd),
      sub:
        maxDdPct != null && maxDdPct !== ''
          ? `${Number(maxDdPct).toFixed(2)}% vs peak equity`
          : null,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900 bg-opacity-20',
    },
  ];

  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-2">Summary</h3>
      {strategyLabel && <p className="text-sm text-dark-400 mb-4">{strategyLabel}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border border-dark-600 ${metric.bgColor}`}
          >
            <p className="text-dark-400 text-sm mb-2">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            {metric.sub && <p className="text-xs text-dark-500 mt-1">{metric.sub}</p>}
          </div>
        ))}
      </div>

      {createdAt && (
        <div className="mt-6 pt-4 border-t border-dark-700 text-sm text-dark-400">
          <p>Backtest run on {new Date(createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
