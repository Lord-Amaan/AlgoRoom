export default function EquityCurve({ trades = [] }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <p className="text-dark-500 text-sm">No trades to display.</p>
      </div>
    );
  }

  // Calculate cumulative PnL
  let cumulativePnL = 0;
  const equityCurveData = trades.map((trade) => {
    cumulativePnL += trade.pnl || 0;
    return {
      trade: trade,
      pnl: cumulativePnL,
    };
  });

  // Find min and max for scaling
  const pnlValues = equityCurveData.map((d) => d.pnl);
  const minPnL = Math.min(...pnlValues, 0);
  const maxPnL = Math.max(...pnlValues, 0);
  const range = maxPnL - minPnL || 1;

  // Chart dimensions
  const chartHeight = 250;
  const chartWidth = 100;
  const points = equityCurveData.map((d, idx) => {
    const x = (idx / (equityCurveData.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((d.pnl - minPnL) / range) * chartHeight;
    return { x, y, pnl: d.pnl };
  });

  // Generate SVG path
  const pathData = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>

      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64 border border-dark-600 rounded"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight/2}
            x2={chartWidth}
            y2={chartHeight/2}
            stroke="#444"
            strokeDasharray="4"
            strokeWidth="0.5"
          />

          {/* Equity curve line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          {/* Points on curve */}
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

        {/* Legend */}
        <div className="mt-4 text-sm text-dark-400 space-y-2 w-full">
          <div className="flex justify-between items-center">
            <span>Starting Capital: 0</span>
            <span className="font-semibold text-green-400">
              Final: +{(equityCurveData[equityCurveData.length - 1]?.pnl || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Min: {minPnL.toFixed(2)}</span>
            <span>Max: {maxPnL.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="p-3 bg-dark-700 rounded">
          <p className="text-dark-400 mb-1">Winning Trades</p>
          <p className="text-green-400 font-semibold">
            {trades.filter((t) => (t.pnl || 0) > 0).length}
          </p>
        </div>
        <div className="p-3 bg-dark-700 rounded">
          <p className="text-dark-400 mb-1">Losing Trades</p>
          <p className="text-red-400 font-semibold">
            {trades.filter((t) => (t.pnl || 0) < 0).length}
          </p>
        </div>
        <div className="p-3 bg-dark-700 rounded">
          <p className="text-dark-400 mb-1">Break Even</p>
          <p className="text-blue-400 font-semibold">
            {trades.filter((t) => (t.pnl || 0) === 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
