import api from './api';

export const strategyService = {
  getAll: () => api.get('/strategies'),
  getTemplates: () => api.get('/strategies/templates'),
  getById: (id) => api.get(`/strategies/${id}`),
  create: (data) => api.post('/strategies', data),
  update: (id, data) => api.put(`/strategies/${id}`, data),
  delete: (id) => api.delete(`/strategies/${id}`),
};

export const backtestService = {
  run: (data) => api.post('/backtest', data),
  getAll: () => api.get('/backtest'),
  getById: (id) => api.get(`/backtest/${id}`),
};

export const tradeService = {
  getAll: (deploymentId) => api.get('/trades', deploymentId ? { params: { deploymentId } } : undefined),
  getPositions: (deploymentId) =>
    api.get('/trades/positions', deploymentId ? { params: { deploymentId } } : undefined),
  deploy: (strategyId, data = {}) => api.post(`/trades/deploy/${strategyId}`, data),
  stop: (strategyId) => api.post(`/trades/stop/${strategyId}`),
};
