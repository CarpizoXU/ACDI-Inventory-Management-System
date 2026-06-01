import api from './api';

const createPhysicalCount = (payload) => api.post('/physical-counts/create', payload);
const listPhysicalCounts = (params) => api.get('/physical-counts/list', { params });
const getPhysicalCountById = (id) => api.get(`/physical-counts/${id}`);

export default {
  createPhysicalCount,
  listPhysicalCounts,
  getPhysicalCountById,
};
