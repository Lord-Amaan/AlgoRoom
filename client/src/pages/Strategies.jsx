import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strategyService } from '../services/strategyService';
import StrategyModal from '../components/StrategyModal';
import { SkeletonStrategyList } from '../components/Skeleton';

export default function Strategies() {
  const navigate = useNavigate();
  const [listLoading, setListLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadStrategies = async () => {
    try {
      setListLoading(true);
      setStatus('');
      const response = await strategyService.getAll();
      setStrategies(response?.data?.data || []);
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to load strategies');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const handleCardClick = (strategy) => {
    setSelectedStrategy(strategy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStrategy(null);
  };

  const handleEditClick = () => {
    if (selectedStrategy) {
      navigate(`/strategy-builder?edit=${selectedStrategy._id}`);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedStrategy) return;
    try {
      await strategyService.delete(selectedStrategy._id);
      setStatus('Strategy deleted successfully');
      handleCloseModal();
      loadStrategies();
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to delete strategy');
    }
  };

  const handleDuplicateClick = async () => {
    if (!selectedStrategy) return;
    try {
      const newName = `Copy of ${selectedStrategy.name}`;
      const payload = {
        name: newName,
        strategyType: selectedStrategy.strategyType,
        instruments: selectedStrategy.instruments || [],
        orderConfig: selectedStrategy.orderConfig,
        legs: selectedStrategy.legs || [],
        riskManagement: selectedStrategy.riskManagement,
        advanceFeatures: selectedStrategy.advanceFeatures,
      };
      await strategyService.create(payload);
      setStatus('Strategy duplicated successfully');
      loadStrategies();
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to duplicate strategy');
    }
  };

  const handleBacktestClick = () => {
    if (selectedStrategy) {
      navigate(`/backtesting?strategyId=${selectedStrategy._id}`);
    }
  };

  const handleDeployClick = () => {
    if (selectedStrategy) {
      navigate(`/live-trading?strategyId=${selectedStrategy._id}`);
    }
  };

  const filteredStrategies = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return strategies;
    }

    return strategies.filter((strategy) => {
      const byName = strategy?.name?.toLowerCase().includes(query);
      const byType = strategy?.strategyType?.toLowerCase().includes(query);
      const byInstrument = Array.isArray(strategy?.instruments)
        ? strategy.instruments.some((symbol) => symbol.toLowerCase().includes(query))
        : false;
      return byName || byType || byInstrument;
    });
  }, [searchText, strategies]);

  return (
    <div className="relative min-h-full rounded-3xl bg-gradient-to-br from-[#f8fbff] via-[#f4f6fb] to-[#eef1f8] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-16 -right-14 h-56 w-56 rounded-full bg-[#d9ebff] opacity-70 blur-3xl" />
        <div className="absolute bottom-2 left-8 h-56 w-56 rounded-full bg-[#fde8cf] opacity-60 blur-3xl" />
      </div>

      <section className="relative rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d2838]">My Strategies</h1>
            <p className="mt-1 text-sm text-[#5f6d80]">View all created strategies and edit them in the builder.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStrategies}
              className="rounded-md border border-[#d2deee] bg-white px-3 py-1.5 text-xs font-semibold text-[#536c8f] hover:bg-[#f3f7ff]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/strategy-builder')}
              className="rounded-md border border-[#2f6fbc] bg-[#2f6fbc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#255f9f]"
            >
              + New Strategy
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name, type or instrument"
            className="h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm text-[#1d2838] outline-none ring-[#8caad8] focus:ring"
          />
        </div>

        {status ? <p className="mb-3 text-sm font-semibold text-[#8c3f3f]">{status}</p> : null}
        
        {listLoading && <SkeletonStrategyList />}
        {!listLoading && !filteredStrategies.length && <p className="text-sm text-[#61718a]">No strategies found.</p>}

        {!listLoading && filteredStrategies.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredStrategies.map((strategy) => (
            <article
              key={strategy._id}
              onClick={() => handleCardClick(strategy)}
              className="cursor-pointer rounded-xl border border-[#d7e1ef] bg-[#f8fbff] p-3 transition hover:border-[#99b5dd] hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#24466f]">{strategy.name || 'Untitled Strategy'}</h3>
                  <p className="mt-0.5 text-xs text-[#6d7f97]">{strategy.strategyType || 'TIME_BASED'}</p>
                </div>
              </div>

              <p className="mb-2 text-xs text-[#71849d]">Legs: {strategy?.legs?.length || 0}</p>

              <div className="flex flex-wrap gap-1.5">
                {(strategy?.instruments || []).slice(0, 4).map((symbol) => (
                  <span key={symbol} className="rounded-full border border-[#c7d9f2] bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#3a6293]">
                    {symbol}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        )}
      </section>

      <StrategyModal
        strategy={selectedStrategy}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onDuplicate={handleDuplicateClick}
        onBacktest={handleBacktestClick}
        onDeploy={handleDeployClick}
      />
    </div>
  );
}