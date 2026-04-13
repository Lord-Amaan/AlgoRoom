/**
 * daily_pnl: [{ date: "YYYY-MM-DD", pnl: number }, ...] from backend
 */
export default function DailyPnlChart({ dailyPnl = [] }) {
  if (!dailyPnl?.length) {
    return (
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-semibold mb-4">Daily P&amp;L</h3>
        <p className="text-dark-500 text-sm">No daily breakdown available.</p>
      </div>
    );
  }

  const pnls = dailyPnl.map((d) => Number(d.pnl ?? 0));
  const minP = Math.min(...pnls, 0);
  const maxP = Math.max(...pnls, 0);
  const range = maxP - minP || 1;

  const chartW = Math.min(800, Math.max(240, dailyPnl.length * 14));
  const chartH = 200;
  const barW = chartW / dailyPnl.length;
  const innerW = barW * 0.7;
  const pad = (barW - innerW) / 2;

  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-4">Daily P&amp;L</h3>
      <div className="overflow-x-auto">
        <svg
          width={chartW}
          height={chartH + 40}
          className="mx-auto"
          style={{ minWidth: '100%' }}
        >
          <line
            x1="0"
            y1={chartH - ((-minP / range) * chartH)}
            x2={chartW}
            y2={chartH - ((-minP / range) * chartH)}
            stroke="#444"
            strokeWidth="0.5"
          />
          {dailyPnl.map((day, i) => {
            const pnl = Number(day.pnl ?? 0);
            const h = (Math.abs(pnl) / range) * chartH * 0.9;
            const zeroY = chartH - ((-minP / range) * chartH);
            const y = pnl >= 0 ? zeroY - h : zeroY;
            const x = i * barW + pad;
            return (
              <rect
                key={day.date ?? i}
                x={x}
                y={y}
                width={innerW}
                height={Math.max(h, 1)}
                fill={pnl >= 0 ? '#10b981' : '#ef4444'}
                rx="1"
              />
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-dark-500 mt-2 text-center">
        {dailyPnl.length} trading day{dailyPnl.length !== 1 ? 's' : ''} (backend)
      </p>
    </div>
  );
}
