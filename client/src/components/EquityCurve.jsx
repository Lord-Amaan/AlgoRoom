<<<<<<< Updated upstream
export default function EquityCurve({ data = [] }) {
  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
      <p className="text-dark-500 text-sm">
        Equity curve chart will be rendered here.
      </p>
=======
/**
 * Renders backend-computed equity_curve only (cumulative_pnl per point).
 */
export default function EquityCurve({ equityCurve = [], summary }) {
  const winningTrades = summary?.winning_trades;
  const losingTrades = summary?.losing_trades;
  const breakevenTrades = summary?.breakeven_trades;

  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <p className="text-dark-500 text-sm">No equity points to display.</p>
      </div>
    );
  }

  const pnlValues = equityCurve.map((d) => Number(d.cumulative_pnl ?? 0));
  const minPnL = Math.min(...pnlValues, 0);
  const maxPnL = Math.max(...pnlValues, 0);
  const range = maxPnL - minPnL || 1;

  const chartHeight = 250;
  const chartWidth = 100;
  const points = equityCurve.map((d, idx) => {
    const pnl = Number(d.cumulative_pnl ?? 0);
    const x = (idx / (equityCurve.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((pnl - minPnL) / range) * chartHeight;
    return { x, y, pnl };
  });

  const pathData = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const finalPnl = pnlValues[pnlValues.length - 1] ?? 0;

  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
      <p className="text-xs text-dark-500 mb-2">Cumulative P&amp;L (backend, exit-time order)</p>

      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64 border border-dark-600 rounded"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <line
            x1="0"
            y1={chartHeight / 2}
            x2={chartWidth}
            y2={chartHeight / 2}
            stroke="#444"
            strokeDasharray="4"
            strokeWidth="0.5"
          />
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          {points.map((point, idx) => (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={point.pnl >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </svg>

        <div className="mt-4 text-sm text-dark-400 space-y-2 w-full">
          <div className="flex justify-between items-center">
            <span>Start: ₹ 0.00</span>
            <span className={`font-semibold ${finalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Final cumulative:{' '}
              {finalPnl >= 0 ? '+' : ''}
              {finalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Min: {minPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span>Max: {maxPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {winningTrades != null && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 bg-dark-700 rounded">
            <p className="text-dark-400 mb-1">Winning Trades</p>
            <p className="text-green-400 font-semibold">{winningTrades}</p>
          </div>
          <div className="p-3 bg-dark-700 rounded">
            <p className="text-dark-400 mb-1">Losing Trades</p>
            <p className="text-red-400 font-semibold">{losingTrades ?? '—'}</p>
          </div>
          <div className="p-3 bg-dark-700 rounded">
            <p className="text-dark-400 mb-1">Break Even</p>
            <p className="text-blue-400 font-semibold">{breakevenTrades ?? '—'}</p>
          </div>
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
