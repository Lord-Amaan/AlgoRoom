import { useState } from 'react';

const ExpandableSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#e1e8f0]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f8fbff] transition text-left"
      >
        <h3 className="font-semibold text-sm text-[#2f4f80]">{title}</h3>
        <svg
          className={`w-4 h-4 text-[#6b7c95] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {isOpen && <div className="px-4 py-3 bg-[#fafbfd] text-sm text-[#5f6d80]">{children}</div>}
    </div>
  );
};

export default function StrategyModal({
  strategy,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onBacktest,
  onDeploy,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !strategy) return null;

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDuplicate = () => {
    onDuplicate();
    onClose();
  };

  const handleBacktest = () => {
    onBacktest();
    onClose();
  };

  const handleDeploy = () => {
    onDeploy();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[#d7e1ef]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-[#e1e8f0] bg-gradient-to-r from-[#f8fbff] to-[#f4f6fb]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#1d2838]">{strategy.name}</h2>
                <p className="mt-1 text-xs text-[#8aa5cb] font-semibold">
                  {strategy.strategyType?.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8aa5cb] hover:text-[#2f4f80] transition"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Instruments */}
            {strategy.instruments && strategy.instruments.length > 0 && (
              <div className="px-6 py-4 border-b border-[#e1e8f0]">
                <h3 className="text-sm font-semibold text-[#2f4f80] mb-3">Instruments</h3>
                <div className="flex flex-wrap gap-2">
                  {strategy.instruments.map((symbol) => (
                    <span
                      key={symbol}
                      className="inline-flex items-center rounded-full border border-[#c7d9f2] bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#3a6293]"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Order Config Section */}
            {strategy.orderConfig && (
              <ExpandableSection title="Order Configuration">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Order Type</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">{strategy.orderConfig.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Start Time</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">{strategy.orderConfig.startTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Square Off</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">{strategy.orderConfig.squareOff}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Active Days</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">
                        {strategy.orderConfig.activeDays?.join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Legs Section */}
            {strategy.legs && strategy.legs.length > 0 && (
              <ExpandableSection title={`Legs (${strategy.legs.length})`}>
                <div className="space-y-4">
                  {strategy.legs.map((leg, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-[#d6e0ee] bg-white p-3 space-y-2"
                    >
                      <p className="font-semibold text-[#335786]">Leg {index + 1}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Qty</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.qty}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Position</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.position}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Option Type</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.optionType}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Expiry</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.expiry}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Strike Criteria</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.strikeCriteria}</p>
                        </div>
                        <div>
                          <p className="text-[#8aa5cb] font-semibold uppercase">Strike Type</p>
                          <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.strikeType}</p>
                        </div>
                        {leg.sl !== undefined && leg.sl !== null && (
                          <div>
                            <p className="text-[#8aa5cb] font-semibold uppercase">SL ({leg.slType})</p>
                            <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.sl}</p>
                          </div>
                        )}
                        {leg.tp !== undefined && leg.tp !== null && (
                          <div>
                            <p className="text-[#8aa5cb] font-semibold uppercase">TP ({leg.tpType})</p>
                            <p className="text-[#2f4f80] font-semibold mt-0.5">{leg.tp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* Risk Management Section */}
            {strategy.riskManagement && (
              <ExpandableSection title="Risk Management">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {strategy.riskManagement.exitOnProfit !== undefined &&
                      strategy.riskManagement.exitOnProfit !== null && (
                        <div>
                          <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Exit on Profit</p>
                          <p className="text-sm font-semibold text-[#2f4f80] mt-1">
                            {strategy.riskManagement.exitOnProfit}
                          </p>
                        </div>
                      )}
                    {strategy.riskManagement.exitOnLoss !== undefined &&
                      strategy.riskManagement.exitOnLoss !== null && (
                        <div>
                          <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Exit on Loss</p>
                          <p className="text-sm font-semibold text-[#2f4f80] mt-1">
                            {strategy.riskManagement.exitOnLoss}
                          </p>
                        </div>
                      )}
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">No Trade After</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">
                        {strategy.riskManagement.noTradeAfter}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8aa5cb] font-semibold uppercase">Profit Trailing</p>
                      <p className="text-sm font-semibold text-[#2f4f80] mt-1">
                        {strategy.riskManagement.profitTrailing?.replace(/_/g, ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Advance Features Section */}
            {strategy.advanceFeatures && (
              <ExpandableSection title="Advance Features">
                <div className="space-y-2">
                  {Object.entries(strategy.advanceFeatures).map(([key, enabled]) => {
                    if (!enabled) return null;
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#4a9d6f]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-[#2f4f80]">{label}</span>
                      </div>
                    );
                  })}
                  {!Object.values(strategy.advanceFeatures).some(Boolean) && (
                    <p className="text-xs text-[#8aa5cb]">No advance features enabled</p>
                  )}
                </div>
              </ExpandableSection>
            )}
          </div>

          {/* Footer - Action Buttons */}
          <div className="border-t border-[#e1e8f0] bg-[#fafbfd] px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 min-w-[120px] rounded-lg bg-[#2f6fbc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#255f9f] transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 min-w-[120px] rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b71c1c] transition"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex-1 min-w-[120px] rounded-lg border border-[#90add7] bg-[#e5efff] px-4 py-2 text-sm font-semibold text-[#2a548a] hover:bg-[#d9e8ff] transition"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={handleBacktest}
                className="flex-1 min-w-[120px] rounded-lg border border-[#90add7] bg-[#e5efff] px-4 py-2 text-sm font-semibold text-[#2a548a] hover:bg-[#d9e8ff] transition"
              >
                Backtest
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                className="flex-1 min-w-[120px] rounded-lg border border-[#90add7] bg-[#e5efff] px-4 py-2 text-sm font-semibold text-[#2a548a] hover:bg-[#d9e8ff] transition"
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[60]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[61] p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm border border-[#d7e1ef]">
              <h3 className="text-lg font-bold text-[#1d2838]">Confirm Delete</h3>
              <p className="mt-2 text-sm text-[#5f6d80]">
                Are you sure you want to delete "{strategy.name}"? This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-[#d2deee] bg-white px-4 py-2 text-sm font-semibold text-[#4d6486] hover:bg-[#f3f7ff] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b71c1c] transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
