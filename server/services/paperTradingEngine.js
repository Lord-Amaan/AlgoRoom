const StrategyDeployment = require('../models/StrategyDeployment');
const Position = require('../models/Position');
const Trade = require('../models/Trade');
const Strategy = require('../models/Strategy');
const { getOHLCData } = require('../utils/dataProvider');
const { emit } = require('./realtime');

class PaperTradingEngine {
  constructor() {
    this.runners = new Map();
  }

  parseHm(value, fallback = '09:16') {
    const raw = String(value || fallback).trim();
    const [hhRaw, mmRaw] = raw.split(':');
    const hh = Number(hhRaw);
    const mm = Number(mmRaw || 0);
    if (Number.isNaN(hh) || Number.isNaN(mm)) {
      const [fh, fm] = fallback.split(':').map((n) => Number(n));
      return fh * 60 + fm;
    }
    return hh * 60 + mm;
  }

  getNowIst() {
    const now = new Date();
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    }).format(now);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return {
      weekday: weekday.toUpperCase().slice(0, 3),
      minutesFromMidnight: hour * 60 + minute,
    };
  }

  isWithinTradingWindow(strategy) {
    const orderConfig = strategy?.orderConfig || {};
    const activeDays = Array.isArray(orderConfig.activeDays) && orderConfig.activeDays.length
      ? orderConfig.activeDays.map((d) => String(d).toUpperCase())
      : ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    const startHm = this.parseHm(orderConfig.startTime, '09:16');
    const squareOffHm = this.parseHm(orderConfig.squareOff, '15:15');
    const now = this.getNowIst();

    if (!activeDays.includes(now.weekday)) {
      return {
        ok: false,
        reason: `Non-trading day (${now.weekday})`,
      };
    }

    if (now.minutesFromMidnight < startHm) {
      return {
        ok: false,
        reason: 'Market session has not started for this strategy',
      };
    }

    if (now.minutesFromMidnight >= squareOffHm) {
      return {
        ok: false,
        reason: 'Strategy square-off time already passed',
      };
    }

    return { ok: true, reason: '' };
  }

  getStrikeSpacing(instrument) {
    const symbol = String(instrument || '').toUpperCase();
    if (symbol === 'BANKNIFTY') return 100;
    if (symbol === 'FINNIFTY') return 50;
    return 50;
  }

  roundToSpacing(value, spacing) {
    return Math.round(Number(value || 0) / spacing) * spacing;
  }

  getStrikeOffsetValue(strikeType, spacing) {
    const normalized = String(strikeType || 'ATM').toUpperCase();
    const map = {
      ATM: 0,
      OTM_1: 1,
      OTM_2: 2,
      OTM_3: 3,
      ITM_1: 1,
      ITM_2: 2,
    };
    return (map[normalized] || 0) * spacing;
  }

  getStrikeForLeg(spotPrice, leg, instrument) {
    const spacing = this.getStrikeSpacing(instrument);
    const atmStrike = this.roundToSpacing(spotPrice, spacing);
    const offset = this.getStrikeOffsetValue(leg?.strikeType, spacing);
    const optionType = String(leg?.optionType || 'CALL').toUpperCase();
    const strikeType = String(leg?.strikeType || 'ATM').toUpperCase();

    if (strikeType === 'ATM') {
      return atmStrike;
    }

    if (strikeType.startsWith('OTM')) {
      return optionType === 'CALL' ? atmStrike + offset : atmStrike - offset;
    }

    if (strikeType.startsWith('ITM')) {
      return optionType === 'CALL' ? atmStrike - offset : atmStrike + offset;
    }

    return atmStrike;
  }

  getSyntheticOptionPrice(spotPrice, strike, optionType) {
    const spot = Number(spotPrice || 0);
    const strikePrice = Number(strike || 0);
    const option = String(optionType || 'CALL').toUpperCase();
    const intrinsic = option === 'CALL' ? Math.max(0, spot - strikePrice) : Math.max(0, strikePrice - spot);
    const moneynessDistance = Math.abs(spot - strikePrice);
    const spacing = Math.max(1, this.getStrikeSpacing('NIFTY'));
    const timeValueFloor = Math.max(12, spot * 0.0025);
    const decay = Math.exp(-moneynessDistance / (spacing * 4));
    const premium = intrinsic + timeValueFloor * decay;
    return Number(Math.max(1, premium).toFixed(2));
  }

  async startDeployment(deploymentId) {
    const deployment = await StrategyDeployment.findById(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (deployment.mode !== 'PAPER') {
      throw new Error('Only PAPER mode is supported right now');
    }

    if (this.runners.has(String(deployment._id))) {
      return deployment;
    }

    const strategy = await Strategy.findById(deployment.strategy);
    if (!strategy) {
      deployment.status = 'ERROR';
      deployment.lastError = 'Strategy not found';
      await deployment.save();
      throw new Error('Strategy not found');
    }

    const activeLegs = (strategy.legs || []).filter((leg) => leg?.isActive !== false);
    if (!activeLegs.length) {
      deployment.status = 'ERROR';
      deployment.lastError = 'Strategy has no active legs';
      await deployment.save();
      throw new Error('Strategy has no active legs');
    }

    const marketWindow = this.isWithinTradingWindow(strategy);
    let markPrice = Number(deployment.lastPrice || 0);
    if (marketWindow.ok) {
      markPrice = await this.getLatestMarkPrice(deployment.instrument);
      await this.openInitialPaperPositions(deployment, strategy, activeLegs, markPrice);
    }

    deployment.status = 'RUNNING';
    deployment.lastError = marketWindow.ok ? '' : `Waiting for market window: ${marketWindow.reason}`;
    deployment.lastPrice = markPrice;
    deployment.lastHeartbeatAt = new Date();
    await deployment.save();

    emit('deployment:updated', {
      deploymentId: String(deployment._id),
      userId: deployment.userId,
      status: deployment.status,
      mode: deployment.mode,
      instrument: deployment.instrument,
      timeframe: deployment.timeframe,
      realizedPnl: deployment.realizedPnl,
      unrealizedPnl: deployment.unrealizedPnl,
      totalPnl: deployment.totalPnl,
      lastPrice: deployment.lastPrice,
      lastHeartbeatAt: deployment.lastHeartbeatAt,
    });

    const intervalMs = Math.max(5, Number(deployment.pollIntervalSec || 20)) * 1000;
    const intervalRef = setInterval(async () => {
      await this.tick(deployment._id);
    }, intervalMs);

    this.runners.set(String(deployment._id), intervalRef);
    return deployment;
  }

  async stopDeployment(deploymentId, reason = 'MANUAL_STOP') {
    const deployment = await StrategyDeployment.findById(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const runnerId = String(deployment._id);
    if (this.runners.has(runnerId)) {
      clearInterval(this.runners.get(runnerId));
      this.runners.delete(runnerId);
    }

    deployment.status = 'STOPPING';
    deployment.stopReason = reason;
    deployment.lastHeartbeatAt = new Date();
    await deployment.save();

    await this.closeAllOpenPositions(deployment._id, reason);

    const updated = await StrategyDeployment.findById(deployment._id);
    updated.unrealizedPnl = 0;
    updated.totalPnl = Number(updated.realizedPnl || 0);
    updated.status = 'STOPPED';
    updated.stoppedAt = new Date();
    updated.lastHeartbeatAt = new Date();
    await updated.save();

    await Strategy.findByIdAndUpdate(updated.strategy, { isActive: false });

    emit('deployment:updated', {
      deploymentId: String(updated._id),
      userId: updated.userId,
      status: updated.status,
      mode: updated.mode,
      instrument: updated.instrument,
      timeframe: updated.timeframe,
      realizedPnl: updated.realizedPnl,
      unrealizedPnl: updated.unrealizedPnl,
      totalPnl: updated.totalPnl,
      lastPrice: updated.lastPrice,
      stopReason: updated.stopReason,
      stoppedAt: updated.stoppedAt,
    });

    return updated;
  }

  async recoverRunningDeployments() {
    const running = await StrategyDeployment.find({
      mode: 'PAPER',
      status: { $in: ['STARTING', 'RUNNING'] },
    }).select('_id');

    for (const dep of running) {
      try {
        await this.startDeployment(dep._id);
      } catch (error) {
        await StrategyDeployment.findByIdAndUpdate(dep._id, {
          status: 'ERROR',
          lastError: error.message,
          lastHeartbeatAt: new Date(),
        });
      }
    }
  }

  async tick(deploymentId) {
    const deployment = await StrategyDeployment.findById(deploymentId);
    if (!deployment || deployment.status !== 'RUNNING') {
      return;
    }

    try {
      const strategy = await Strategy.findById(deployment.strategy);
      if (!strategy) {
        await this.stopDeployment(deployment._id, 'STRATEGY_NOT_FOUND');
        return;
      }

      const marketWindow = this.isWithinTradingWindow(strategy);
      if (!marketWindow.ok) {
        if (this.isSquareOffTime(strategy)) {
          await this.closeAllOpenPositions(deployment._id, 'SQUARE_OFF_TIME');
        }

        deployment.lastError = `Waiting for market window: ${marketWindow.reason}`;
        deployment.lastHeartbeatAt = new Date();
        await deployment.save();

        emit('deployment:updated', {
          deploymentId: String(deployment._id),
          userId: deployment.userId,
          status: deployment.status,
          mode: deployment.mode,
          instrument: deployment.instrument,
          timeframe: deployment.timeframe,
          realizedPnl: deployment.realizedPnl,
          unrealizedPnl: deployment.unrealizedPnl,
          totalPnl: deployment.totalPnl,
          lastPrice: deployment.lastPrice,
          lastHeartbeatAt: deployment.lastHeartbeatAt,
          lastError: deployment.lastError,
        });
        return;
      }

      if (this.isSquareOffTime(strategy)) {
        await this.closeAllOpenPositions(deployment._id, 'SQUARE_OFF_TIME');
        deployment.unrealizedPnl = 0;
        deployment.totalPnl = Number(deployment.realizedPnl || 0);
        deployment.lastHeartbeatAt = new Date();
        await deployment.save();
        return;
      }

      const activeLegs = (strategy.legs || []).filter((leg) => leg?.isActive !== false);
      const openCount = await Position.countDocuments({
        deployment: deployment._id,
        isActive: true,
        mode: 'PAPER',
      });

      if (!openCount) {
        const openedToday = await this.hasOpenedTradeToday(deployment._id);
        if (!openedToday && activeLegs.length) {
          const entryMark = await this.getLatestMarkPrice(deployment.instrument);
          await this.openInitialPaperPositions(deployment, strategy, activeLegs, entryMark);
        }
      }

      const price = await this.getLatestMarkPrice(deployment.instrument);
      const openPositions = await Position.find({
        deployment: deployment._id,
        isActive: true,
        mode: 'PAPER',
      });

      let unrealizedPnl = 0;
      for (const position of openPositions) {
        const leg = strategy.legs?.[position.legIndex] || {};
        const mark = this.getSyntheticOptionPrice(price, position.strike, position.optionType);
        const pnl = this.calculatePnl(position.entryPrice, mark, position.quantity, position.position);
        position.currentPrice = mark;
        position.unrealizedPnl = pnl;
        unrealizedPnl += pnl;
        await position.save();

        const exitReason = this.getExitReason(leg, position.entryPrice, mark, position.position);
        if (exitReason) {
          await this.closePosition(position, mark, exitReason);
        }
      }

      const refreshOpen = await Position.find({
        deployment: deployment._id,
        isActive: true,
        mode: 'PAPER',
      });
      unrealizedPnl = refreshOpen.reduce((sum, p) => sum + Number(p.unrealizedPnl || 0), 0);

      deployment.unrealizedPnl = unrealizedPnl;
      deployment.totalPnl = Number(deployment.realizedPnl || 0) + unrealizedPnl;
      deployment.lastPrice = price;
      deployment.lastError = '';
      deployment.lastHeartbeatAt = new Date();
      await deployment.save();

      emit('deployment:updated', {
        deploymentId: String(deployment._id),
        userId: deployment.userId,
        status: deployment.status,
        mode: deployment.mode,
        instrument: deployment.instrument,
        timeframe: deployment.timeframe,
        realizedPnl: deployment.realizedPnl,
        unrealizedPnl: deployment.unrealizedPnl,
        totalPnl: deployment.totalPnl,
        lastPrice: deployment.lastPrice,
        lastHeartbeatAt: deployment.lastHeartbeatAt,
      });

      const refreshedPositions = await Position.find({
        deployment: deployment._id,
        mode: 'PAPER',
      }).sort({ createdAt: -1 });

      emit('positions:updated', {
        deploymentId: String(deployment._id),
        userId: deployment.userId,
        activeCount: refreshedPositions.filter((position) => position.isActive).length,
        totalUnrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        positions: refreshedPositions.map((position) => ({
          id: String(position._id),
          symbol: position.symbol,
          legIndex: position.legIndex,
          position: position.position,
          optionType: position.optionType,
          strike: position.strike,
          quantity: position.quantity,
          entryPrice: position.entryPrice,
          currentPrice: position.currentPrice,
          unrealizedPnl: position.unrealizedPnl,
          isActive: position.isActive,
          deployment: String(position.deployment),
        })),
      });

      if (deployment.maxDailyLoss > 0 && deployment.totalPnl <= -Math.abs(deployment.maxDailyLoss)) {
        await this.stopDeployment(deployment._id, 'MAX_DAILY_LOSS_HIT');
        return;
      }
    } catch (error) {
      await StrategyDeployment.findByIdAndUpdate(deploymentId, {
        status: 'ERROR',
        lastError: error.message,
        lastHeartbeatAt: new Date(),
      });
      const runnerId = String(deploymentId);
      if (this.runners.has(runnerId)) {
        clearInterval(this.runners.get(runnerId));
        this.runners.delete(runnerId);
      }
    }
  }

  async openInitialPaperPositions(deployment, strategy, activeLegs, markPrice) {
    const entryTime = new Date();
    const docs = activeLegs.map((leg, index) => {
      const quantity = Number(leg.qty || 1);
      const positionType = leg.position || 'BUY';
      const optionType = leg.optionType || 'CALL';
      const strike = this.getStrikeForLeg(markPrice, leg, deployment.instrument);
      const symbol = `${deployment.instrument}_${optionType}_${leg.strikeType || 'ATM'}`;
      const entryPrice = this.getSyntheticOptionPrice(markPrice, strike, optionType);

      return {
        user: deployment.userId,
        strategy: strategy._id,
        deployment: deployment._id,
        instrument: deployment.instrument,
        symbol,
        position: positionType,
        optionType,
        strike,
        legIndex: index,
        entryPrice,
        currentPrice: entryPrice,
        quantity,
        unrealizedPnl: 0,
        isActive: true,
        mode: 'PAPER',
        isPaper: true,
      };
    });

    await Position.insertMany(docs);
    emit('positions:updated', {
      deploymentId: String(deployment._id),
      userId: deployment.userId,
      activeCount: docs.length,
      positions: docs,
    });

    const tradeDocs = docs.map((d) => ({
      user: d.user,
      strategy: d.strategy,
      deployment: d.deployment,
      instrument: d.instrument,
      symbol: d.symbol,
      position: d.position,
      optionType: d.optionType,
      legIndex: d.legIndex,
      entryPrice: d.entryPrice,
      strike: d.strike,
      quantity: d.quantity,
      pnl: 0,
      status: 'open',
      entryTime,
      mode: 'PAPER',
      isLive: false,
      isPaper: true,
    }));
    await Trade.insertMany(tradeDocs);
  }

  async closePosition(position, exitPrice, reason = 'RULE_EXIT') {
    const pnl = this.calculatePnl(position.entryPrice, exitPrice, position.quantity, position.position);

    position.isActive = false;
    position.currentPrice = exitPrice;
    position.unrealizedPnl = 0;
    await position.save();

    const trade = await Trade.findOne({
      deployment: position.deployment,
      strategy: position.strategy,
      legIndex: position.legIndex,
      status: 'open',
      mode: 'PAPER',
    }).sort({ createdAt: -1 });

    if (trade) {
      trade.exitPrice = exitPrice;
      trade.exitTime = new Date();
      trade.pnl = pnl;
      trade.status = 'closed';
      await trade.save();

      emit('trade:updated', {
        tradeId: String(trade._id),
        deploymentId: String(position.deployment),
        userId: trade.user,
        symbol: trade.symbol,
        legIndex: trade.legIndex,
        status: trade.status,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        pnl: trade.pnl,
        exitTime: trade.exitTime,
        mode: trade.mode,
      });
    }

    await StrategyDeployment.findByIdAndUpdate(position.deployment, {
      $inc: { realizedPnl: pnl },
      $set: { lastHeartbeatAt: new Date(), stopReason: reason },
    });

    emit('position:closed', {
      deploymentId: String(position.deployment),
      positionId: String(position._id),
      symbol: position.symbol,
      legIndex: position.legIndex,
      exitPrice,
      pnl,
      reason,
    });
  }

  async closeAllOpenPositions(deploymentId, reason) {
    const deployment = await StrategyDeployment.findById(deploymentId);
    if (!deployment) return;

    const price = await this.getLatestMarkPrice(deployment.instrument).catch(() => Number(deployment.lastPrice || 0));
    const fallbackPrice = Number(price || deployment.lastPrice || 0);
    const openPositions = await Position.find({
      deployment: deploymentId,
      isActive: true,
      mode: 'PAPER',
    });

    for (const position of openPositions) {
      const exitUnderlying = fallbackPrice > 0 ? fallbackPrice : Number(position.currentPrice || position.entryPrice || 0);
      const exitPrice = this.getSyntheticOptionPrice(exitUnderlying, position.strike, position.optionType);
      await this.closePosition(position, exitPrice, reason);
    }
  }

  async getLatestMarkPrice(instrument) {
    const { startDate, endDate } = this.lastFewDaysWindow();
    const candles = await getOHLCData(instrument, startDate, endDate, '1min', {
      disableCache: true,
    });
    if (!candles?.length) {
      throw new Error(`No market data available for ${instrument}`);
    }
    return Number(candles[candles.length - 1].close);
  }

  lastFewDaysWindow() {
    const now = new Date();
    const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    return {
      startDate: this.toDateStringIST(start),
      endDate: this.toDateStringIST(now),
    };
  }

  toDateStringIST(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const g = (type) => parts.find((p) => p.type === type)?.value;
    return `${g('year')}-${g('month')}-${g('day')}`;
  }

  getIstDayBounds(date = new Date()) {
    const dateString = this.toDateStringIST(date);
    const start = new Date(`${dateString}T00:00:00+05:30`);
    const end = new Date(`${dateString}T23:59:59.999+05:30`);
    return { start, end };
  }

  async hasOpenedTradeToday(deploymentId) {
    const { start, end } = this.getIstDayBounds(new Date());
    const existing = await Trade.findOne({
      deployment: deploymentId,
      mode: 'PAPER',
      entryTime: { $gte: start, $lte: end },
    }).select('_id');
    return Boolean(existing);
  }

  calculatePnl(entry, current, qty, side) {
    const quantity = Number(qty || 0);
    const diff = Number(current || 0) - Number(entry || 0);
    const signed = side === 'SELL' ? -diff : diff;
    return Number((signed * quantity).toFixed(2));
  }

  getExitReason(leg, entryPrice, currentPrice, side) {
    const slHit = this.checkSl(leg, entryPrice, currentPrice, side);
    if (slHit) return 'SL_HIT';

    const tpHit = this.checkTp(leg, entryPrice, currentPrice, side);
    if (tpHit) return 'TP_HIT';

    return null;
  }

  checkSl(leg, entryPrice, currentPrice, side) {
    const slValue = Number(leg?.sl);
    if (!slValue || slValue <= 0 || !leg?.slType) return false;

    let threshold = slValue;
    if (leg.slType === 'SL%') {
      threshold = (Number(entryPrice) * slValue) / 100;
    }

    if (side === 'BUY') {
      return Number(currentPrice) <= Number(entryPrice) - threshold;
    }
    return Number(currentPrice) >= Number(entryPrice) + threshold;
  }

  checkTp(leg, entryPrice, currentPrice, side) {
    const tpValue = Number(leg?.tp);
    if (!tpValue || tpValue <= 0 || !leg?.tpType) return false;

    let threshold = tpValue;
    if (leg.tpType === 'TP%') {
      threshold = (Number(entryPrice) * tpValue) / 100;
    }

    if (side === 'BUY') {
      return Number(currentPrice) >= Number(entryPrice) + threshold;
    }
    return Number(currentPrice) <= Number(entryPrice) - threshold;
  }

  isSquareOffTime(strategy) {
    const squareOff = strategy?.orderConfig?.squareOff;
    if (!squareOff || typeof squareOff !== 'string') return false;

    const [hh, mm] = squareOff.split(':').map((n) => Number(n));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return false;

    const nowParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const h = Number(nowParts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(nowParts.find((p) => p.type === 'minute')?.value || 0);

    return h * 60 + m >= hh * 60 + mm;
  }
}

module.exports = new PaperTradingEngine();
