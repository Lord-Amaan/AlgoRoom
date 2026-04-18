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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Backtest Results</h3>
        <p className="text-slate-500 text-sm">
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
      color: totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bgColor: totalPnl >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
    },
    {
      label: 'Win Rate',
      value: `${Number(winRate).toFixed(2)}%`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Trades',
      value: String(totalTrades),
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'Max Drawdown',
      value: formatInr(maxDd),
      sub:
        maxDdPct != null && maxDdPct !== ''
          ? `${Number(maxDdPct).toFixed(2)}% vs peak equity`
          : null,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-slate-900">Backtest Summary</h3>
      {strategyLabel && <p className="text-sm text-slate-500 mb-4">{strategyLabel}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border border-slate-200 ${metric.bgColor}`}
          >
            <p className="text-slate-500 text-sm mb-2">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            {metric.sub && <p className="text-xs text-slate-500 mt-1">{metric.sub}</p>}
          </div>
        ))}
      </div>

      {createdAt && (
        <div className="mt-6 pt-4 border-t border-slate-200 text-sm text-slate-500">
          <p>Backtest run on {new Date(createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
