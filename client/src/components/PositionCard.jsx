export default function PositionCard({ trade, index }) {
  if (!trade) {
    return null;
  }

  const pnl = trade.pnl ?? trade.profit ?? 0;
  const entryPrice = trade.entry_price ?? trade.entryPrice ?? 0;
  const exitPrice = trade.exit_price ?? trade.exitPrice ?? 0;
  const entryTime = trade.entry_time ?? trade.entryTime;
  const exitTime = trade.exit_time ?? trade.exitTime;
  const returnPct = trade.return_pct;
  const exitReason = trade.exit_reason;

  const pnlPercentage =
    entryPrice !== 0 ? ((Number(pnl) / Number(entryPrice)) * 100).toFixed(2) : '0.00';

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-slate-900">Trade #{index}</p>
          <p className="text-xs text-slate-500 mt-1">
            {entryTime ? new Date(entryTime).toLocaleString() : 'N/A'} →{' '}
            {exitTime ? new Date(exitTime).toLocaleString() : 'N/A'}
          </p>
          {exitReason && (
            <p className="text-xs text-slate-500 mt-1">Exit: {exitReason}</p>
          )}
        </div>
        <div
          className={`px-3 py-1 rounded text-sm font-semibold ${
            pnl >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          {pnl >= 0 ? '+' : ''}
          {Number(pnl).toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Entry</p>
          <p className="font-semibold text-slate-900">{Number(entryPrice).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500">Exit</p>
          <p className="font-semibold text-slate-900">{Number(exitPrice).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500">Status</p>
          <p
            className={`font-semibold ${
              trade.status === 'closed' ? 'text-blue-600' : 'text-amber-600'
            }`}
          >
            {trade.status || 'closed'}
          </p>
        </div>
        <div>
          <p className="text-slate-500">P&amp;L % (vs entry)</p>
          <p
            className={`font-semibold ${
              Number(pnlPercentage) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {Number(pnlPercentage) >= 0 ? '+' : ''}
            {pnlPercentage}%
          </p>
        </div>
        {returnPct != null && (
          <div className="col-span-2">
            <p className="text-slate-500">Return % (engine)</p>
            <p className="font-semibold text-slate-900">{Number(returnPct).toFixed(4)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
