import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import { strategyService, tradeService } from '../services/strategyService';

function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  if (window.location.port === '5173' || window.location.port === '3000') {
    return 'http://localhost:5000';
  }

  return window.location.origin;
}

export default function LiveTrading() {
  const { userId } = useAuth();
  const socketRef = useRef(null);
  const [strategies, setStrategies] = useState([]);
  const [positionsPayload, setPositionsPayload] = useState({ positions: [], summary: {} });
  const [tradesPayload, setTradesPayload] = useState({ trades: [], deployments: [] });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [eventFeed, setEventFeed] = useState([]);
  const [busyStrategyId, setBusyStrategyId] = useState('');
  const [activeDeploymentId, setActiveDeploymentId] = useState('');
  const [deployForm, setDeployForm] = useState({
    instrument: 'NIFTY',
    timeframe: '1min',
    capital: 100000,
    maxDailyLoss: 2000,
    pollIntervalSec: 20,
  });

  const runningByStrategy = useMemo(() => {
    const map = new Map();
    for (const dep of tradesPayload.deployments || []) {
      const strategyId = dep?.strategy?._id || dep?.strategy;
      if (!strategyId) continue;
      if (dep.status === 'RUNNING' || dep.status === 'STARTING' || dep.status === 'STOPPING') {
        map.set(String(strategyId), dep);
      }
    }
    return map;
  }, [tradesPayload.deployments]);

  const activeDeployments = useMemo(() => {
    return (tradesPayload.deployments || []).filter((deployment) =>
      ['STARTING', 'RUNNING', 'STOPPING'].includes(deployment.status)
    );
  }, [tradesPayload.deployments]);

  const recentTrades = useMemo(() => {
    const source = activeDeploymentId
      ? (tradesPayload.trades || []).filter((trade) => String(trade.deployment || '') === String(activeDeploymentId))
      : tradesPayload.trades || [];
    return source.slice(0, 20);
  }, [activeDeploymentId, tradesPayload.trades]);

  useEffect(() => {
    const latestActive = [...activeDeployments].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.startedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.startedAt || 0).getTime();
      return bTime - aTime;
    })[0];

    if (latestActive?._id) {
      setActiveDeploymentId(String(latestActive._id));
      return;
    }

    setActiveDeploymentId('');
  }, [activeDeployments]);

  const refreshData = async (deploymentId = activeDeploymentId) => {
    const [strategiesRes, positionsRes, tradesRes] = await Promise.all([
      strategyService.getAll(),
      tradeService.getPositions(deploymentId || undefined),
      tradeService.getAll(deploymentId || undefined),
    ]);

    setStrategies(strategiesRes?.data?.data || []);
    setPositionsPayload(positionsRes?.data?.data || { positions: [], summary: {} });
    setTradesPayload(tradesRes?.data?.data || { trades: [], deployments: [] });
  };

  const pushFeedEvent = (label) => {
    setEventFeed((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ].slice(0, 8));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refreshData();
      } catch (error) {
        setStatus(error?.response?.data?.error || 'Failed to load paper trading data');
      } finally {
        setLoading(false);
      }
    };

    load();

    const intervalId = setInterval(() => {
      refreshData().catch(() => {
        // Keep polling silent to avoid UI noise.
      });
    }, 30000);

    const socket = io(resolveSocketUrl(), {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('connected');
      pushFeedEvent('Socket connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
      pushFeedEvent('Socket disconnected');
    });

    socket.on('realtime:connected', () => {
      setSocketStatus('connected');
    });

    const handleUserScopedUpdate = async (label, payload) => {
      if (payload?.userId && userId && payload.userId !== userId) {
        return;
      }

      if (activeDeploymentId && payload?.deploymentId && String(payload.deploymentId) !== String(activeDeploymentId)) {
        return;
      }

      pushFeedEvent(label);
      await refreshData();
    };

    socket.on('deployment:updated', (payload) => {
      handleUserScopedUpdate('Deployment updated', payload).catch(() => {});
    });

    socket.on('positions:updated', (payload) => {
      handleUserScopedUpdate('Positions updated', payload).catch(() => {});
    });

    socket.on('trade:updated', (payload) => {
      handleUserScopedUpdate('Trade updated', payload).catch(() => {});
    });

    socket.on('position:closed', (payload) => {
      handleUserScopedUpdate('Position closed', payload).catch(() => {});
    });

    socket.on('connect_error', () => {
      setSocketStatus('disconnected');
    });

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, activeDeploymentId]);

  const handleDeploy = async (strategyId) => {
    try {
      setBusyStrategyId(strategyId);
      setStatus('');
      await tradeService.deploy(strategyId, {
        mode: 'PAPER',
        instrument: deployForm.instrument,
        timeframe: deployForm.timeframe,
        capital: Number(deployForm.capital),
        maxDailyLoss: Number(deployForm.maxDailyLoss),
        pollIntervalSec: Number(deployForm.pollIntervalSec),
      });
      await refreshData();
      setStatus('Paper strategy deployed successfully');
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to deploy strategy');
    } finally {
      setBusyStrategyId('');
    }
  };

  const handleStop = async (strategyId) => {
    try {
      setBusyStrategyId(strategyId);
      setStatus('');
      await tradeService.stop(strategyId);
      await refreshData();
      setStatus('Paper deployment stopped successfully');
    } catch (error) {
      setStatus(error?.response?.data?.error || 'Failed to stop strategy');
    } finally {
      setBusyStrategyId('');
    }
  };

  const activePositions = activeDeploymentId
    ? (positionsPayload.positions || []).filter((position) => String(position.deployment || '') === String(activeDeploymentId))
    : positionsPayload.positions || [];
  const totalUnrealized = activePositions.reduce((sum, position) => sum + Number(position.unrealizedPnl || 0), 0);

  const formatResume = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#dce4f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d2838]">Paper Trading Control Center</h1>
            <p className="mt-2 text-sm text-[#5f6d80]">
              Deploy strategies in paper mode, monitor real-time PnL, and stop instantly with one click.
            </p>
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${socketStatus === 'connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            Socket: {socketStatus}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <select
            value={deployForm.instrument}
            onChange={(event) => setDeployForm((prev) => ({ ...prev, instrument: event.target.value }))}
            className="h-10 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
          >
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="FINNIFTY">FINNIFTY</option>
            <option value="GOLDBEES">GOLDBEES</option>
          </select>
          <select
            value={deployForm.timeframe}
            onChange={(event) => setDeployForm((prev) => ({ ...prev, timeframe: event.target.value }))}
            className="h-10 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
          >
            <option value="1min">1 Minute</option>
            <option value="5min">5 Minutes</option>
            <option value="15min">15 Minutes</option>
            <option value="1hour">1 Hour</option>
            <option value="1day">1 Day</option>
          </select>
          <input
            type="number"
            min="1000"
            step="100"
            value={deployForm.capital}
            onChange={(event) => setDeployForm((prev) => ({ ...prev, capital: event.target.value }))}
            placeholder="Capital"
            className="h-10 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
          />
          <input
            type="number"
            min="100"
            step="100"
            value={deployForm.maxDailyLoss}
            onChange={(event) => setDeployForm((prev) => ({ ...prev, maxDailyLoss: event.target.value }))}
            placeholder="Max Daily Loss"
            className="h-10 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
          />
          <input
            type="number"
            min="5"
            max="120"
            value={deployForm.pollIntervalSec}
            onChange={(event) => setDeployForm((prev) => ({ ...prev, pollIntervalSec: event.target.value }))}
            placeholder="Poll Sec"
            className="h-10 rounded-lg border border-[#cedaec] bg-[#f5f8ff] px-3 text-sm"
          />
        </div>

        {eventFeed.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {eventFeed.map((event) => (
              <span key={event.id} className="rounded-full border border-[#d7e1ef] bg-[#f8fbff] px-3 py-1 text-xs text-[#5f6d80]">
                {event.time} {event.label}
              </span>
            ))}
          </div>
        ) : null}

        {status ? <p className="mt-3 text-sm font-semibold text-[#7b3340]">{status}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#dce4f0] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7f97]">Active Positions</p>
          <p className="mt-1 text-3xl font-semibold text-[#1d2838]">{activePositions.length}</p>
        </div>
        <div className="rounded-2xl border border-[#dce4f0] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7f97]">Unrealized PnL</p>
          <p className={`mt-1 text-3xl font-semibold ${totalUnrealized >= 0 ? 'text-[#1f7a3f]' : 'text-[#a73636]'}`}>
            {totalUnrealized.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce4f0] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7f97]">Running Deployments</p>
          <p className="mt-1 text-3xl font-semibold text-[#1d2838]">{runningByStrategy.size}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#dce4f0] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#1d2838]">Strategies</h2>
        {loading ? <p className="text-sm text-[#6d7f97]">Loading strategies...</p> : null}

        {!loading && !strategies.length ? <p className="text-sm text-[#6d7f97]">No strategies available.</p> : null}

        {!loading && strategies.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {strategies.map((strategy) => {
              const running = runningByStrategy.get(String(strategy._id));
              const isBusy = busyStrategyId === strategy._id;

              return (
                <article key={strategy._id} className="rounded-xl border border-[#d7e1ef] bg-[#f8fbff] p-4">
                  <h3 className="text-sm font-semibold text-[#24466f]">{strategy.name || 'Untitled Strategy'}</h3>
                  <p className="mt-1 text-xs text-[#6d7f97]">{strategy.strategyType || 'N/A'}</p>
                  <p className="mt-1 text-xs text-[#6d7f97]">Legs: {strategy?.legs?.length || 0}</p>

                  {running ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-[#1f7a3f]">
                        {running.status} | PnL: {Number(running.totalPnl || 0).toFixed(2)}
                      </p>
                      <p className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${running.sessionState === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        Session: {running.sessionState || 'PAUSED'}
                      </p>
                      {running.sessionReason ? (
                        <p className="text-[11px] text-[#6d7f97]">{running.sessionReason}</p>
                      ) : null}
                      {running.nextResumeAt ? (
                        <p className="text-[11px] text-[#6d7f97]">Resumes: {formatResume(running.nextResumeAt)} IST</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-[#8a5a21]">Not running</p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={!!running || isBusy}
                      onClick={() => handleDeploy(strategy._id)}
                      className="rounded-md border border-[#2f6fbc] bg-[#2f6fbc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#255f9f] disabled:cursor-not-allowed disabled:border-[#d2d9e2] disabled:bg-[#eef1f5] disabled:text-[#7a8797]"
                    >
                      {isBusy && !running ? 'Deploying...' : 'Deploy Paper'}
                    </button>
                    <button
                      type="button"
                      disabled={!running || isBusy}
                      onClick={() => handleStop(strategy._id)}
                      className="rounded-md border border-[#d04d4d] bg-[#d04d4d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b43f3f] disabled:cursor-not-allowed disabled:border-[#d2d9e2] disabled:bg-[#eef1f5] disabled:text-[#7a8797]"
                    >
                      {isBusy && running ? 'Stopping...' : 'Stop'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#dce4f0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1d2838]">Open Positions</h2>
          {!activePositions.length ? <p className="text-sm text-[#6d7f97]">No open positions.</p> : null}
          <div className="space-y-3">
            {activePositions.map((position) => (
              <div key={position._id} className="rounded-xl border border-[#d7e1ef] bg-[#f8fbff] p-3">
                <p className="text-sm font-semibold text-[#24466f]">{position.symbol}</p>
                <p className="mt-1 text-xs text-[#6d7f97]">
                  {position.position} {position.quantity}{position.strike != null ? ` | Strike: ${Number(position.strike).toFixed(0)}` : ''} | Entry: {Number(position.entryPrice || 0).toFixed(2)} | LTP:{' '}
                  {Number(position.currentPrice || 0).toFixed(2)}
                </p>
                <p className={`mt-1 text-xs font-semibold ${Number(position.unrealizedPnl || 0) >= 0 ? 'text-[#1f7a3f]' : 'text-[#a73636]'}`}>
                  Unrealized: {Number(position.unrealizedPnl || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#dce4f0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#1d2838]">Recent Trades</h2>
          {!recentTrades.length ? <p className="text-sm text-[#6d7f97]">No trades yet.</p> : null}
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div key={trade._id} className="rounded-xl border border-[#d7e1ef] bg-[#f8fbff] p-3">
                <p className="text-sm font-semibold text-[#24466f]">{trade.symbol}</p>
                <p className="mt-1 text-xs text-[#6d7f97]">
                  {trade.status.toUpperCase()} | Qty: {trade.quantity}{trade.strike != null ? ` | Strike: ${Number(trade.strike).toFixed(0)}` : ''} | Entry: {Number(trade.entryPrice || 0).toFixed(2)}
                  {trade.exitPrice != null ? ` | Exit: ${Number(trade.exitPrice).toFixed(2)}` : ''}
                </p>
                <p className={`mt-1 text-xs font-semibold ${Number(trade.pnl || 0) >= 0 ? 'text-[#1f7a3f]' : 'text-[#a73636]'}`}>
                  PnL: {Number(trade.pnl || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
