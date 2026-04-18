/**
 * calendar: { "YYYY-MM": { "1": pnl, "2": pnl, ... } } from backend
 */
export default function CalendarHeatmap({ calendar = {} }) {
  const months = Object.keys(calendar).sort();
  if (!months.length) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Daywise Breakdown</h3>
        <p className="text-slate-500 text-sm">No calendar data available.</p>
      </div>
    );
  }

  const allValues = months.flatMap((m) => Object.values(calendar[m] || {}).map(Number));
  const maxAbs = Math.max(...allValues.map((v) => Math.abs(v)), 1);

  const cell = (pnl) => {
    const v = Number(pnl ?? 0);
    const intensity = Math.min(1, Math.abs(v) / maxAbs);
    const green = v >= 0;
    const bg = green
      ? `rgba(16, 185, 129, ${0.15 + intensity * 0.55})`
      : `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;
    return { bg, v };
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Daywise Breakdown</h3>
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {months.map((ym) => {
          const days = calendar[ym] || {};
          const dayKeys = Object.keys(days).sort((a, b) => Number(a) - Number(b));
          return (
            <div key={ym}>
              <p className="text-sm font-medium text-slate-600 mb-2">{ym}</p>
              <div className="flex flex-wrap gap-1">
                {dayKeys.map((d) => {
                  const { bg, v } = cell(days[d]);
                  return (
                    <div
                      key={`${ym}-${d}`}
                      title={`${ym}-${d.padStart(2, '0')}: ${v.toFixed(2)}`}
                      className="w-8 h-8 rounded text-[10px] flex items-center justify-center text-white font-medium border border-slate-200"
                      style={{ backgroundColor: bg }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4">Intensity = magnitude of daily P&amp;L (backend)</p>
    </div>
  );
}
