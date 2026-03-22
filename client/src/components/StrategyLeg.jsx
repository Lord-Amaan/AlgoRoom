export default function StrategyLeg({ leg, index, onChange, onRemove }) {
  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dark-300">Leg {index + 1}</span>
        <button
          onClick={() => onRemove(index)}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>
      <p className="text-dark-500 text-xs">
        Configure instrument, position, option type, expiry, strike type, SL, and TP.
      </p>
    </div>
  );
}
