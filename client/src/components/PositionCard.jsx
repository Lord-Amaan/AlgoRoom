<<<<<<< Updated upstream
export default function PositionCard({ position }) {
  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 flex items-center justify-between">
      <div>
        <p className="font-medium">{position?.symbol || 'NIFTY 23500 CE'}</p>
        <p className="text-xs text-dark-500">{position?.position || 'BUY'} · {position?.quantity || 0} qty</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${(position?.unrealizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ₹{position?.unrealizedPnl || 0}
        </p>
=======
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
    <div className="bg-dark-700 p-4 rounded-lg border border-dark-600 hover:border-blue-500 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-white">Trade #{index}</p>
          <p className="text-xs text-dark-400 mt-1">
            {entryTime ? new Date(entryTime).toLocaleString() : 'N/A'} →{' '}
            {exitTime ? new Date(exitTime).toLocaleString() : 'N/A'}
          </p>
          {exitReason && (
            <p className="text-xs text-dark-500 mt-1">Exit: {exitReason}</p>
          )}
        </div>
        <div
          className={`px-3 py-1 rounded text-sm font-semibold ${
            pnl >= 0 ? 'bg-green-900 bg-opacity-30 text-green-400' : 'bg-red-900 bg-opacity-30 text-red-400'
          }`}
        >
          {pnl >= 0 ? '+' : ''}
          {Number(pnl).toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-dark-400">Entry</p>
          <p className="font-semibold text-white">{Number(entryPrice).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-dark-400">Exit</p>
          <p className="font-semibold text-white">{Number(exitPrice).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-dark-400">Status</p>
          <p
            className={`font-semibold ${
              trade.status === 'closed' ? 'text-blue-400' : 'text-yellow-400'
            }`}
          >
            {trade.status || 'closed'}
          </p>
        </div>
        <div>
          <p className="text-dark-400">P&amp;L % (vs entry)</p>
          <p
            className={`font-semibold ${
              Number(pnlPercentage) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {Number(pnlPercentage) >= 0 ? '+' : ''}
            {pnlPercentage}%
          </p>
        </div>
        {returnPct != null && (
          <div className="col-span-2">
            <p className="text-dark-400">Return % (engine)</p>
            <p className="font-semibold text-white">{Number(returnPct).toFixed(4)}%</p>
          </div>
        )}
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
