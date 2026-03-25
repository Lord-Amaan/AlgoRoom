import { useState } from 'react';
import { strategyService } from '../services/strategyService';

export default function StrategyBuilder() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setStatus('Please enter strategy name');
      return;
    }

    try {
      setLoading(true);
      setStatus('');

      await strategyService.create({
        name: name.trim(),
        strategyType: 'TIME_BASED',
        instruments: ['NIFTY'],
        orderConfig: { type: 'MIS', startTime: '09:16', squareOff: '15:15', activeDays: ['MON'] },
        legs: [],
      });

      setStatus('Strategy saved in DB');
      setName('');
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to create strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Strategy Builder</h1>
      <p className="text-dark-400 mb-4">Create and manage multi-leg options strategies.</p>

      <div className="max-w-md space-y-3">
        <input
          className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2"
          placeholder="Strategy name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-accent-500 hover:bg-accent-600 rounded disabled:opacity-50"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Strategy'}
        </button>
        {status ? <p className="text-sm text-dark-300">{status}</p> : null}
      </div>
    </div>
  );
}
