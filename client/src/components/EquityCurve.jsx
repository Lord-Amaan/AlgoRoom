import { useState } from 'react';

/**
 * Renders backend-computed equity_curve only (cumulative_pnl per point).
 */
export default function EquityCurve({ equityCurve = [], summary }) {
  const [hoverInfo, setHoverInfo] = useState(null);
  const winningTrades = summary?.winning_trades;
  const losingTrades = summary?.losing_trades;
  const breakevenTrades = summary?.breakeven_trades;

  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Equity Curve</h3>
        <p className="text-slate-500 text-sm">No equity points to display.</p>
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
    return {
      x,
      y,
      pnl,
      tradePnl: Number(d.trade_pnl ?? 0),
      exitTime: d.exit_time || null,
    };
  });

  const pathData = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const finalPnl = pnlValues[pnlValues.length - 1] ?? 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">P&amp;L Curve</h3>
      <p className="text-xs text-slate-500 mb-2">Cumulative P&amp;L (backend, exit-time order)</p>

      <div className="flex flex-col items-center">
        <div className="w-full relative">
          {hoverInfo && (
            <div
              className="absolute z-10 px-3 py-2 rounded-lg border border-slate-200 bg-white shadow text-xs text-slate-700 pointer-events-none"
              style={{ left: hoverInfo.left, top: hoverInfo.top }}
            >
              <p className="font-semibold text-slate-900 mb-1">
                {hoverInfo.exitTime ? new Date(hoverInfo.exitTime).toLocaleString() : 'Trade point'}
              </p>
              <p>Trade P&amp;L: {hoverInfo.tradePnl >= 0 ? '+' : ''}{hoverInfo.tradePnl.toFixed(2)}</p>
              <p>Cumulative: {hoverInfo.pnl >= 0 ? '+' : ''}{hoverInfo.pnl.toFixed(2)}</p>
            </div>
          )}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64 border border-slate-200 rounded-xl"
          style={{ backgroundColor: '#eef5ff' }}
        >
          <line
            x1="0"
            y1={chartHeight / 2}
            x2={chartWidth}
            y2={chartHeight / 2}
            stroke="#9aa7bc"
            strokeDasharray="4"
            strokeWidth="0.5"
          />
          <path d={pathData} fill="none" stroke="#0c82f5" strokeWidth="1.8" />
          {points.map((point, idx) => (
            <g key={idx}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill={point.pnl >= 0 ? '#16a34a' : '#ef4444'}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="transparent"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                  setHoverInfo({
                    left: e.clientX - rect.left + 10,
                    top: e.clientY - rect.top - 10,
                    pnl: point.pnl,
                    tradePnl: point.tradePnl,
                    exitTime: point.exitTime,
                  });
                }}
                onMouseLeave={() => setHoverInfo(null)}
              />
            </g>
          ))}
        </svg>
        </div>

        <div className="mt-4 text-sm text-slate-600 space-y-2 w-full">
          <div className="flex justify-between items-center">
            <span>Start: ₹ 0.00</span>
            <span className={`font-semibold ${finalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-slate-500 mb-1">Winning Trades</p>
            <p className="text-emerald-600 font-semibold">{winningTrades}</p>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-slate-500 mb-1">Losing Trades</p>
            <p className="text-rose-600 font-semibold">{losingTrades ?? '—'}</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-slate-500 mb-1">Break Even</p>
            <p className="text-blue-600 font-semibold">{breakevenTrades ?? '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
