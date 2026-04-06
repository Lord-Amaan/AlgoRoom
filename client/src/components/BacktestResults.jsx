export default function BacktestResults({ result }) {
  if (!result) {
    return (
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-semibold mb-4">Backtest Results</h3>
        <p className="text-dark-500 text-sm">
          Results will be displayed here after running a backtest.
        </p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total P&L',
      value: `${result.pnl >= 0 ? '+' : ''}${result.pnl?.toFixed(2) || 0}`,
      color: result.pnl >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: result.pnl >= 0 ? 'bg-green-900 bg-opacity-20' : 'bg-red-900 bg-opacity-20',
    },
    {
      label: 'Win Rate',
      value: `${result.winRate?.toFixed(2) || 0}%`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900 bg-opacity-20',
    },
    {
      label: 'Total Trades',
      value: result.totalTrades || 0,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900 bg-opacity-20',
    },
    {
      label: 'Max Drawdown',
      value: `${result.maxDrawdown?.toFixed(2) || 0}%`,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900 bg-opacity-20',
    },
  ];

  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
      <h3 className="text-lg font-semibold mb-6">Summary Results</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border border-dark-600 ${metric.bgColor}`}
          >
            <p className="text-dark-400 text-sm mb-2">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      {result.createdAt && (
        <div className="mt-6 pt-4 border-t border-dark-700 text-sm text-dark-400">
          <p>
            Backtest run on {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
