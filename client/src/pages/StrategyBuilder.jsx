import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { strategyService } from '../services/strategyService';

const STRATEGY_TYPES = [
  { value: 'TIME_BASED', label: 'Option Trading - Time Based' },
  { value: 'INDICATOR_BASED', label: 'Option Trading - Indicator Based' },
  { value: 'STOCKS_FUTURES', label: 'Stocks & Futures - Indicator Based' },
];

const ORDER_TYPES = ['MIS', 'CNC', 'BTST'];
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const POSITION_OPTIONS = ['BUY', 'SELL'];
const OPTION_TYPES = ['CALL', 'PUT'];
const EXPIRY_OPTIONS = ['WEEKLY', 'MONTHLY'];
const SLTP_TYPES = ['SL%', 'SL_POINTS'];
const TPTYPES = ['TP%', 'TP_POINTS'];

const PROFIT_TRAILING = [
  { value: 'NO_TRAILING', label: 'No Trailing' },
  { value: 'LOCK_FIX', label: 'Lock Fix Profit' },
  { value: 'TRAIL_PROFIT', label: 'Trail Profit' },
  { value: 'LOCK_AND_TRAIL', label: 'Lock and Trail' },
];

const ADVANCE_FEATURES = [
  { key: 'moveSLtoCost', label: 'Move SL to Cost' },
  { key: 'exitAllOnSLTgt', label: 'Exit All on SL/Tgt' },
  { key: 'prePunchSL', label: 'Pre Punch SL' },
  { key: 'waitAndTrade', label: 'Wait & Trade' },
  { key: 'premiumDifference', label: 'Premium Difference' },
  { key: 'reEntryExecute', label: 'Re Entry/Execute' },
  { key: 'trailSL', label: 'Trail SL' },
];

const PRESET_INSTRUMENTS = [
  'NIFTY 50',
  'NIFTY BANK',
  'NIFTY FIN',
  'SENSEX',
];

const createEmptyLeg = () => ({
  qty: 0,
  position: 'BUY',
  optionType: 'CALL',
  expiry: 'WEEKLY',
  strikeCriteria: 'ATM pt',
  strikeType: 'ATM',
  slType: 'SL%',
  sl: 0,
  slOnPrice: 'On Price',
  tpType: 'TP%',
  tp: 0,
  tpOnPrice: 'On Price',
  isActive: true,
});

const getInitialForm = () => ({
  name: '',
  strategyType: 'TIME_BASED',
  instruments: [],
  orderConfig: {
    type: 'MIS',
    startTime: '09:16',
    squareOff: '15:15',
    activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  legs: [createEmptyLeg()],
  riskManagement: {
    exitOnProfit: '',
    exitOnLoss: '',
    noTradeAfter: '15:15',
    profitTrailing: 'NO_TRAILING',
  },
  advanceFeatures: {
    moveSLtoCost: false,
    exitAllOnSLTgt: false,
    prePunchSL: false,
    waitAndTrade: false,
    premiumDifference: false,
    reEntryExecute: false,
    trailSL: false,
  },
});

const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const mapStrategyToForm = (strategy) => ({
  name: strategy?.name || '',
  strategyType: strategy?.strategyType || 'TIME_BASED',
  instruments: Array.isArray(strategy?.instruments) ? strategy.instruments : [],
  orderConfig: {
    type: strategy?.orderConfig?.type || 'MIS',
    startTime: strategy?.orderConfig?.startTime || '09:16',
    squareOff: strategy?.orderConfig?.squareOff || '15:15',
    activeDays: strategy?.orderConfig?.activeDays?.length
      ? strategy.orderConfig.activeDays
      : ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  legs: strategy?.legs?.length
    ? strategy.legs.map((leg) => ({
      ...createEmptyLeg(),
      ...leg,
      qty: leg.qty ?? 0,
      sl: leg.sl ?? 0,
      tp: leg.tp ?? 0,
    }))
    : [createEmptyLeg()],
  riskManagement: {
    exitOnProfit: strategy?.riskManagement?.exitOnProfit ?? '',
    exitOnLoss: strategy?.riskManagement?.exitOnLoss ?? '',
    noTradeAfter: strategy?.riskManagement?.noTradeAfter || '15:15',
    profitTrailing: strategy?.riskManagement?.profitTrailing || 'NO_TRAILING',
  },
  advanceFeatures: {
    moveSLtoCost: Boolean(strategy?.advanceFeatures?.moveSLtoCost),
    exitAllOnSLTgt: Boolean(strategy?.advanceFeatures?.exitAllOnSLTgt),
    prePunchSL: Boolean(strategy?.advanceFeatures?.prePunchSL),
    waitAndTrade: Boolean(strategy?.advanceFeatures?.waitAndTrade),
    premiumDifference: Boolean(strategy?.advanceFeatures?.premiumDifference),
    reEntryExecute: Boolean(strategy?.advanceFeatures?.reEntryExecute),
    trailSL: Boolean(strategy?.advanceFeatures?.trailSL),
  },
});

export default function StrategyBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [instrumentInput, setInstrumentInput] = useState('');
  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    const loadEditData = async () => {
      if (!editId) {
        setEditingId(null);
        setForm(getInitialForm());
        return;
      }

      try {
        setInitializing(true);
        const response = await strategyService.getById(editId);
        const strategy = response?.data?.data;
        if (!strategy) {
          setStatus('Strategy not found');
          return;
        }

        setForm(mapStrategyToForm(strategy));
        setEditingId(strategy._id);
        setStatus(`Editing ${strategy.name || 'strategy'}`);
      } catch (error) {
        setStatus(error?.response?.data?.error || 'Failed to load strategy');
      } finally {
        setInitializing(false);
      }
    };

    loadEditData();
  }, [editId]);

  const payload = useMemo(() => ({
    name: form.name.trim(),
    strategyType: form.strategyType,
    instruments: form.instruments,
    orderConfig: {
      type: form.orderConfig.type,
      startTime: form.orderConfig.startTime,
      squareOff: form.orderConfig.squareOff,
      activeDays: form.orderConfig.activeDays,
    },
    legs: form.legs.map((leg) => ({
      ...leg,
      qty: parseOptionalNumber(leg.qty) ?? 0,
      sl: parseOptionalNumber(leg.sl),
      tp: parseOptionalNumber(leg.tp),
    })),
    riskManagement: {
      exitOnProfit: parseOptionalNumber(form.riskManagement.exitOnProfit),
      exitOnLoss: parseOptionalNumber(form.riskManagement.exitOnLoss),
      noTradeAfter: form.riskManagement.noTradeAfter,
      profitTrailing: form.riskManagement.profitTrailing,
    },
    advanceFeatures: form.advanceFeatures,
  }), [form]);

  const setOrderField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      orderConfig: {
        ...prev.orderConfig,
        [key]: value,
      },
    }));
  };

  const setRiskField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      riskManagement: {
        ...prev.riskManagement,
        [key]: value,
      },
    }));
  };

  const setAdvanceFeature = (key, value) => {
    setForm((prev) => ({
      ...prev,
      advanceFeatures: {
        ...prev.advanceFeatures,
        [key]: value,
      },
    }));
  };

  const setLegField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      legs: prev.legs.map((leg, legIndex) => (
        legIndex === index ? { ...leg, [key]: value } : leg
      )),
    }));
  };

  const toggleActiveDay = (day) => {
    const isActive = form.orderConfig.activeDays.includes(day);
    const nextDays = isActive
      ? form.orderConfig.activeDays.filter((activeDay) => activeDay !== day)
      : [...form.orderConfig.activeDays, day];

    setOrderField('activeDays', nextDays);
  };

  const addInstrument = () => {
    const trimmed = instrumentInput.trim();
    if (!trimmed || form.instruments.includes(trimmed)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      instruments: [...prev.instruments, trimmed],
    }));
    setInstrumentInput('');
  };

  const removeInstrument = (symbol) => {
    setForm((prev) => ({
      ...prev,
      instruments: prev.instruments.filter((item) => item !== symbol),
    }));
  };

  const addLeg = () => {
    setForm((prev) => ({
      ...prev,
      legs: [...prev.legs, createEmptyLeg()],
    }));
  };

  const removeLeg = (index) => {
    setForm((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, legIndex) => legIndex !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!payload.name) {
      setStatus('Please enter strategy name');
      return;
    }

    if (!payload.orderConfig.activeDays.length) {
      setStatus('Select at least one active day');
      return;
    }

    try {
      setLoading(true);
      setStatus('');

      if (editingId) {
        await strategyService.update(editingId, payload);
        setStatus('Strategy updated successfully');
      } else {
        await strategyService.create(payload);
        setStatus('Strategy created successfully');
        setForm((prev) => ({
          ...prev,
          name: '',
        }));
      }
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to save strategy');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    navigate('/strategy-builder');
    setEditingId(null);
    setForm(getInitialForm());
    setStatus('');
  };

  if (initializing) {
    return (
      <div className="rounded-2xl border border-[#dce4f0] bg-white/95 p-6 text-sm text-[#61718a] shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
        Loading strategy details...
      </div>
    );
  }

  return (
    <div className="relative min-h-full rounded-3xl bg-gradient-to-br from-[#f8fbff] via-[#f4f6fb] to-[#eef1f8] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-16 -right-14 h-56 w-56 rounded-full bg-[#d9ebff] opacity-70 blur-3xl" />
        <div className="absolute bottom-2 left-8 h-56 w-56 rounded-full bg-[#fde8cf] opacity-60 blur-3xl" />
      </div>

      <div className="relative space-y-5 text-[#1d2838]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategy Builder</h1>
            <p className="mt-1 text-sm text-[#5f6d80]">Build and save multi-leg strategy templates mapped to your execution schema.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/strategies')}
              className="rounded-lg border border-[#d2deee] bg-white px-3 py-2 text-xs font-semibold text-[#4d6486] hover:bg-[#f3f7ff]"
            >
              View Strategies
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-[#d2deee] bg-white px-3 py-2 text-xs font-semibold text-[#4d6486] hover:bg-[#f3f7ff]"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Strategy Type</h2>
              <div className="mt-3 grid gap-2">
                {STRATEGY_TYPES.map((type) => (
                  <label key={type.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#dbe5f2] bg-[#f8fbff] p-2.5 text-sm hover:border-[#93b5e1]">
                    <input
                      type="radio"
                      name="strategyType"
                      checked={form.strategyType === type.value}
                      onChange={() => setForm((prev) => ({ ...prev, strategyType: type.value }))}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Select Instruments</h2>
              <div className="mt-3 flex gap-2">
                <select
                  value={instrumentInput}
                  onChange={(event) => setInstrumentInput(event.target.value)}
                  className="h-10 flex-1 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm outline-none ring-[#8caad8] focus:ring"
                >
                  <option value="">Select an instrument</option>
                  {PRESET_INSTRUMENTS.map((instrument) => (
                    <option key={instrument} value={instrument}>
                      {instrument}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addInstrument}
                  className="h-10 rounded-lg border border-[#97b4df] bg-[#e9f2ff] px-4 text-sm font-semibold text-[#265491] hover:bg-[#dceaff]"
                >
                  + Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.instruments.map((symbol) => (
                  <span key={symbol} className="inline-flex items-center gap-2 rounded-full border border-[#bfd3f0] bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#325f95]">
                    {symbol}
                    <button type="button" className="text-[#8aa5cb] hover:text-[#2a4f81]" onClick={() => removeInstrument(symbol)}>
                      x
                    </button>
                  </span>
                ))}
                {!form.instruments.length && <p className="text-xs text-[#7c8da4]">No instruments selected yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Order Type</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {ORDER_TYPES.map((orderType) => (
                  <button
                    key={orderType}
                    type="button"
                    onClick={() => setOrderField('type', orderType)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                      form.orderConfig.type === orderType
                        ? 'border-[#6596d7] bg-[#e7f1ff] text-[#27548f]'
                        : 'border-[#d4dfef] bg-white text-[#6d7c92]'
                    }`}
                  >
                    {orderType}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-[#6f7d92]">
                  Start Time
                  <input
                    type="time"
                    value={form.orderConfig.startTime}
                    onChange={(event) => setOrderField('startTime', event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm text-[#1d2838] outline-none ring-[#8caad8] focus:ring"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-[#6f7d92]">
                  Square Off
                  <input
                    type="time"
                    value={form.orderConfig.squareOff}
                    onChange={(event) => setOrderField('squareOff', event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm text-[#1d2838] outline-none ring-[#8caad8] focus:ring"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const active = form.orderConfig.activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleActiveDay(day)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                        active
                          ? 'border-[#678fd1] bg-[#dfeeff] text-[#245087]'
                          : 'border-[#d8e1ee] bg-white text-[#7788a1]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Strategy Legs</h2>
              <button
                type="button"
                onClick={addLeg}
                className="rounded-lg border border-[#4f84c6] bg-[#2d67b0] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#245a9e]"
              >
                + Add Leg
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {form.legs.map((leg, index) => (
                <div key={`leg-${index}`} className="rounded-xl border border-[#d6e0ee] bg-[#f8fbff] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#335786]">Leg {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeLeg(index)}
                      disabled={form.legs.length === 1}
                      className="text-xs font-semibold text-[#b35757] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      Qty
                      <input
                        type="number"
                        min="0"
                        value={leg.qty}
                        onChange={(event) => setLegField(index, 'qty', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      Expiry
                      <select
                        value={leg.expiry}
                        onChange={(event) => setLegField(index, 'expiry', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      >
                        {EXPIRY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="flex gap-2">
                      {POSITION_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLegField(index, 'position', value)}
                          className={`h-9 flex-1 rounded-md border text-xs font-semibold ${
                            leg.position === value
                              ? 'border-[#5da57b] bg-[#dff5e8] text-[#1d6d3e]'
                              : 'border-[#cdd8e7] bg-white text-[#6f8098]'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {OPTION_TYPES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLegField(index, 'optionType', value)}
                          className={`h-9 flex-1 rounded-md border text-xs font-semibold ${
                            leg.optionType === value
                              ? 'border-[#5f8ed1] bg-[#deebff] text-[#234f8c]'
                              : 'border-[#cdd8e7] bg-white text-[#6f8098]'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      Strike Criteria
                      <input
                        value={leg.strikeCriteria}
                        onChange={(event) => setLegField(index, 'strikeCriteria', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      Strike Type
                      <input
                        value={leg.strikeType}
                        onChange={(event) => setLegField(index, 'strikeType', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      SL Type
                      <select
                        value={leg.slType}
                        onChange={(event) => setLegField(index, 'slType', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      >
                        {SLTP_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      SL
                      <input
                        type="number"
                        min="0"
                        value={leg.sl}
                        onChange={(event) => setLegField(index, 'sl', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      SL On Price
                      <input
                        value={leg.slOnPrice}
                        onChange={(event) => setLegField(index, 'slOnPrice', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      TP Type
                      <select
                        value={leg.tpType}
                        onChange={(event) => setLegField(index, 'tpType', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      >
                        {TPTYPES.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      TP
                      <input
                        type="number"
                        min="0"
                        value={leg.tp}
                        onChange={(event) => setLegField(index, 'tp', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#6f7d92]">
                      TP On Price
                      <input
                        value={leg.tpOnPrice}
                        onChange={(event) => setLegField(index, 'tpOnPrice', event.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-[#cfdbea] bg-white px-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <section className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Risk Management</h2>
            <p className="mt-1 text-xs text-[#7c8da4]">Control losses, profits, and trailing behavior at strategy level.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-[#6f7d92]">
                Exit on Profit
                <input
                  type="number"
                  value={form.riskManagement.exitOnProfit}
                  onChange={(event) => setRiskField('exitOnProfit', event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#6f7d92]">
                Exit on Loss
                <input
                  type="number"
                  value={form.riskManagement.exitOnLoss}
                  onChange={(event) => setRiskField('exitOnLoss', event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#6f7d92]">
                No Trade After
                <input
                  type="time"
                  value={form.riskManagement.noTradeAfter}
                  onChange={(event) => setRiskField('noTradeAfter', event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PROFIT_TRAILING.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRiskField('profitTrailing', item.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    form.riskManagement.profitTrailing === item.value
                      ? 'border-[#678fd1] bg-[#deebff] text-[#245087]'
                      : 'border-[#d8e1ee] bg-white text-[#7788a1]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Advance Features</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ADVANCE_FEATURES.map((feature) => (
                  <label key={feature.key} className="flex items-center gap-2 rounded-md border border-[#d7e1ef] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#60708a]">
                    <input
                      type="checkbox"
                      checked={form.advanceFeatures[feature.key]}
                      onChange={(event) => setAdvanceFeature(feature.key, event.target.checked)}
                    />
                    {feature.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce4f0] bg-white/95 p-4 shadow-[0_8px_28px_rgba(21,36,61,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2f4f80]">Strategy Name</h2>
              <input
                className="mt-3 h-11 w-full rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm outline-none ring-[#8caad8] focus:ring"
                placeholder="Enter your strategy name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-lg border border-[#2f6fbc] bg-[#2f6fbc] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#255f9f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Strategy' : 'Create Strategy'}
                </button>
                {status ? <p className="text-xs font-semibold text-[#3f5472]">{status}</p> : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
