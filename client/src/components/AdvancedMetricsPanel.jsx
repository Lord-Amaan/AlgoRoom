const LABELS = {
  expectancy: 'Expectancy (% per trade)',
  sharpe_ratio: 'Sharpe ratio',
  sortino_ratio: 'Sortino ratio',
  max_drawdown: 'Max drawdown (₹)',
  max_drawdown_pct: 'Max drawdown (% vs peak)',
  recovery_factor: 'Recovery factor',
  payoff_ratio: 'Payoff ratio',
};

/**
 * advanced_metrics from backend (single source of truth).
 */
export default function AdvancedMetricsPanel({ advancedMetrics = {} }) {
  const entries = Object.entries(advancedMetrics);

  if (!entries.length) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Advanced Metrics</h3>
        <p className="text-slate-500 text-sm">No advanced metrics returned.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Advanced Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200"
          >
            <span className="text-slate-500 text-sm">{LABELS[key] || key}</span>
            <span className="text-slate-800 font-mono text-sm">
              {val == null || val === '' ? '—' : typeof val === 'number' ? Number(val).toFixed(4) : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
