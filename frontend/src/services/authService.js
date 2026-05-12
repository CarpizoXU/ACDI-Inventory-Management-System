import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response;
};

export default {
  login,
};
