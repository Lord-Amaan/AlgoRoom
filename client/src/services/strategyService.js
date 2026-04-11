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
  getAll: () => api.get('/trades'),
  getPositions: () => api.get('/trades/positions'),
  deploy: (strategyId) => api.post(`/trades/deploy/${strategyId}`),
  stop: (strategyId) => api.post(`/trades/stop/${strategyId}`),
};
