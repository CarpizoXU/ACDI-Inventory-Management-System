import { useEffect, useMemo, useState } from 'react';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    const lowStock = products.filter((product) => ['alert', 'critical', 'out-of-stock'].includes(product.stockStatus)).length;
    const outOfStock = products.filter((product) => product.quantity === 0).length;
    const totalItems = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
    return { lowStock, outOfStock, totalItems };
  }, [products]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [productsResponse, transactionsResponse] = await Promise.all([
        productService.listProducts({ limit: 20 }),
        transactionService.getTransactions({ limit: 5 }),
      ]);

      setProducts(productsResponse.data.data.products || []);
      setTransactions(transactionsResponse.data.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total Inventory</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{summary.totalItems}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Low Stock</p>
          <p className="mt-4 text-4xl font-semibold text-amber-600">{summary.lowStock}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Out of Stock</p>
          <p className="mt-4 text-4xl font-semibold text-rose-600">{summary.outOfStock}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Recent activity</p>
              <h2 className="text-xl font-semibold text-slate-900">Latest transactions</h2>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{transaction.product?.name || 'Unknown item'}</p>
                      <p className="text-sm text-slate-500">{transaction.type.replace('-', ' ')} by {transaction.performedBy}</p>
                    </div>
                    <p className="text-sm text-slate-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{transaction.quantity} unit(s)</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">{transaction.product?.category || 'Category'}</span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-sm text-slate-500">No recent transactions available.</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm text-slate-500">Inventory overview</p>
            <h2 className="text-xl font-semibold text-slate-900">Top products</h2>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {products.slice(0, 5).map((product) => (
                <div key={product._id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>
                    <span className="text-sm text-slate-600">{product.quantity} {product.unit}</span>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-sm text-slate-500">No inventory items found.</p>}
            </div>
          )}
        </div>
      </div>

      {error && <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
