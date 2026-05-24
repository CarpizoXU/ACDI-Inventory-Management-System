import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { setCredentials } from '../store/authSlice';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(values) {
    try {
      const response = await authService.login(values);
      dispatch(setCredentials(response.data.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-6">ACDI Inventory Login</h1>
        {error && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 text-white py-3 text-sm font-semibold hover:bg-sky-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
