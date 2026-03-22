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
      </div>
    </div>
  );
}
