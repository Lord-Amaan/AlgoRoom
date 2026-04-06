export default function PositionCard({ trade, index }) {
  if (!trade) {
    return null;
  }

  const pnl = trade.pnl || 0;
  const entryPrice = trade.entryPrice || 0;
  const exitPrice = trade.exitPrice || 0;
  const pnlPercentage = entryPrice !== 0 ? ((pnl / entryPrice) * 100).toFixed(2) : 0;

  return (
    <div className="bg-dark-700 p-4 rounded-lg border border-dark-600 hover:border-blue-500 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-white">Trade #{index}</p>
          <p className="text-xs text-dark-400 mt-1">
            {trade.entryTime ? new Date(trade.entryTime).toLocaleString() : 'N/A'} →{' '}
            {trade.exitTime ? new Date(trade.exitTime).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-sm font-semibold ${
          pnl >= 0 ? 'bg-green-900 bg-opacity-30 text-green-400' : 'bg-red-900 bg-opacity-30 text-red-400'
        }`}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-dark-400">Entry</p>
          <p className="font-semibold text-white">{entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-dark-400">Exit</p>
          <p className="font-semibold text-white">{exitPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-dark-400">Status</p>
          <p className={`font-semibold ${trade.status === 'closed' ? 'text-blue-400' : 'text-yellow-400'}`}>
            {trade.status || 'closed'}
          </p>
        </div>
        <div>
          <p className="text-dark-400">P&L %</p>
          <p className={`font-semibold ${pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
}
