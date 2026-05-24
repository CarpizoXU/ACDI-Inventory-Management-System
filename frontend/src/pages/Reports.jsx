import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusSummary = useMemo(() => {
    const summary = { ok: 0, alert: 0, critical: 0, 'out-of-stock': 0 };
    products.forEach((product) => {
      summary[product.stockStatus] = (summary[product.stockStatus] || 0) + 1;
    });
    return Object.entries(summary).map(([status, value]) => ({ status, value }));
  }, [products]);

  const monthlySummary = useMemo(() => {
    const counts = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  async function loadReports() {
    try {
      setLoading(true);
      const [productsResponse, transactionsResponse] = await Promise.all([
        productService.listProducts({ limit: 100 }),
        transactionService.getTransactions({ limit: 100 }),
      ]);
      setProducts(productsResponse.data.data.products || []);
      setTransactions(transactionsResponse.data.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Inventory total</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{products.length}</p>
          <p className="mt-2 text-sm text-slate-500">Total tracked products.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Transactions</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{transactions.length}</p>
          <p className="mt-2 text-sm text-slate-500">Recent movement count.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Stock alerts</p>
          <p className="mt-4 text-4xl font-semibold text-amber-600">{products.filter((item) => ['alert', 'critical', 'out-of-stock'].includes(item.stockStatus)).length}</p>
          <p className="mt-2 text-sm text-slate-500">Items requiring attention.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Monthly stock movement</p>
              <h2 className="text-xl font-semibold text-slate-900">Transaction summary</h2>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummary || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm text-slate-500">Stock level distribution</p>
            <h2 className="text-xl font-semibold text-slate-900">Status count</h2>
          </div>
          <div className="space-y-3">
            {statusSummary.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.status.replace('-', ' ').toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{item.value} products</p>
                </div>
                <span className="text-lg font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Inventory details</p>
            <h2 className="text-xl font-semibold text-slate-900">Latest products</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Item</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Qty</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {products.slice(0, 8).map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.quantity} {product.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      product.stockStatus === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : product.stockStatus === 'alert'
                        ? 'bg-amber-100 text-amber-700'
                        : product.stockStatus === 'out-of-stock'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {product.stockStatus.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">
                    No products available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
