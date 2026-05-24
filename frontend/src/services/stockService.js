import api from './api';

const stockIn = (payload) => api.post('/stock/stock-in', payload);
const stockOut = (payload) => api.post('/stock/stock-out', payload);

export default {
  stockIn,
  stockOut,
};
