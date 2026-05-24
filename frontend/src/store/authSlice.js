import { createSlice } from '@reduxjs/toolkit';

const stored = typeof window !== 'undefined' ? localStorage.getItem('acdiAuth') : null;
const parsed = stored ? JSON.parse(stored) : null;

const initialState = parsed || {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('acdiAuth', JSON.stringify(action.payload));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('acdiAuth');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
