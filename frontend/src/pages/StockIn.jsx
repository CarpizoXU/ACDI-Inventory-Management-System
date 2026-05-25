import { useEffect, useState } from 'react';
import stockService from '../services/stockService';
import transactionService from '../services/transactionService';
import productService from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  productId: '',
  quantity: 0,
  note: '',
};

export default function StockInPage() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  async function loadData() {
    try {
      setLoading(true);
      const [productsResponse, transactionsResponse] = await Promise.all([
        productService.listProducts({ limit: 100 }),
        transactionService.getTransactions({ type: 'stock-in', limit: 5 }),
      ]);
      setProducts(productsResponse.data.data.products || []);
      setTransactions(transactionsResponse.data.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load stock records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      await stockService.stockIn({
        productId: form.productId,
        quantity: Number(form.quantity),
        performedBy: user?.email || 'system',
        note: form.note,
      });
      setMessage('Stock in recorded successfully');
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to record stock in');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Record incoming inventory items</p>
              <h2 className="text-xl font-semibold text-slate-900">Stock In</h2>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Qty</th>
                    <th className="px-6 py-4 font-semibold">Performed By</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {transactions.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4">{item.product?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{item.product?.category || '-'}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{item.performedBy}</td>
                      <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No stock-in transactions yet.</div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">New Stock Entry</h2>
            <p className="mt-2 text-sm text-slate-500">Fill in the details below to receive stock.</p>
          </div>

          {message && <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Item Name *
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Quantity *
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Note
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Submit Stock In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
