import api from './api';

const listProducts = (params) => api.get('/products', { params });
const createProduct = (payload) => api.post('/products', payload);
const updateProduct = (id, payload) => api.put(`/products/${id}`, payload);
const archiveProduct = (id) => api.delete(`/products/${id}`);

export default {
  listProducts,
  createProduct,
  updateProduct,
  archiveProduct,
};
