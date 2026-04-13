export default function StrategyLeg({ leg, index, onChange, onRemove }) {
  const handleChange = (field, value) => {
    onChange(index, { ...leg, [field]: value });
  };

  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-dark-300">Leg {index + 1}</span>
        <button
          onClick={() => onRemove(index)}
          className="text-xs text-red-400 hover:text-red-300 transition"
        >
          Remove
        </button>
      </div>

      {/* Quantity & Position Row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Quantity *</label>
          <input
            type="number"
            min="1"
            max="10000"
            value={leg.qty || ''}
            onChange={(e) => handleChange('qty', parseInt(e.target.value) || 0)}
            placeholder="50"
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Position *</label>
          <select
            value={leg.position || ''}
            onChange={(e) => handleChange('position', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Option Type *</label>
          <select
            value={leg.optionType || ''}
            onChange={(e) => handleChange('optionType', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="CALL">CALL</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
      </div>

      {/* Expiry & Strike Type Row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Expiry *</label>
          <select
            value={leg.expiry || ''}
            onChange={(e) => handleChange('expiry', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="MONTHLY">MONTHLY</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Strike Type *</label>
          <select
            value={leg.strikeType || ''}
            onChange={(e) => handleChange('strikeType', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="ATM">ATM</option>
            <option value="OTM_1">OTM_1</option>
            <option value="OTM_2">OTM_2</option>
            <option value="OTM_3">OTM_3</option>
            <option value="ITM_1">ITM_1</option>
            <option value="ITM_2">ITM_2</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">Is Active</label>
          <select
            value={leg.isActive !== false ? 'true' : 'false'}
            onChange={(e) => handleChange('isActive', e.target.value === 'true')}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* SL Configuration Row */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-dark-400 mb-1 block">SL Type</label>
          <select
            value={leg.slType || ''}
            onChange={(e) => handleChange('slType', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="SL%">SL%</option>
            <option value="SL_POINTS">SL_POINTS</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">SL Value</label>
          <input
            type="number"
            min="0"
            value={leg.sl || ''}
            onChange={(e) => handleChange('sl', parseFloat(e.target.value) || 0)}
            placeholder="5"
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">SL On Price</label>
          <select
            value={leg.slOnPrice || 'ENTRY'}
            onChange={(e) => handleChange('slOnPrice', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ENTRY">ENTRY</option>
            <option value="CURRENT">CURRENT</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">&nbsp;</label>
          <div className="text-xs text-dark-500 px-2 py-1">SL Configuration</div>
        </div>
      </div>

      {/* TP Configuration Row */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-dark-400 mb-1 block">TP Type</label>
          <select
            value={leg.tpType || ''}
            onChange={(e) => handleChange('tpType', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="TP%">TP%</option>
            <option value="TP_POINTS">TP_POINTS</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">TP Value</label>
          <input
            type="number"
            min="0"
            value={leg.tp || ''}
            onChange={(e) => handleChange('tp', parseFloat(e.target.value) || 0)}
            placeholder="10"
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">TP On Price</label>
          <select
            value={leg.tpOnPrice || 'ENTRY'}
            onChange={(e) => handleChange('tpOnPrice', e.target.value)}
            className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ENTRY">ENTRY</option>
            <option value="CURRENT">CURRENT</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dark-400 mb-1 block">&nbsp;</label>
          <div className="text-xs text-dark-500 px-2 py-1">TP Configuration</div>
        </div>
      </div>
    </div>
  );
}
