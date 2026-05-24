import api from './api';

const getTransactions = (params) => api.get('/transactions', { params });

export default {
  getTransactions,
};
