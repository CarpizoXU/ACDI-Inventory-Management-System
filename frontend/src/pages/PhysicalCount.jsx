import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import productService from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function PhysicalCountPage() {
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedReference, setSubmittedReference] = useState('');

  const countRows = useMemo(() => {
    return products.map((product) => {
      const actual = counts[product._id] != null ? Number(counts[product._id]) : null;
      const variance = actual != null ? actual - product.quantity : null;
      const status = actual == null ? 'Pending' : variance === 0 ? 'Match' : 'Discrepancy';
      return { product, actual, variance, status };
    });
  }, [products, counts]);

  const summary = useMemo(() => {
    const total = countRows.length;
    const counted = countRows.filter((row) => row.actual != null).length;
    const matches = countRows.filter((row) => row.status === 'Match').length;
    const discrepancies = countRows.filter((row) => row.status === 'Discrepancy').length;
    return { total, counted, matches, discrepancies };
  }, [countRows]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await productService.listProducts({ limit: 100 });
      setProducts(response.data.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load products for count');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleCountChange(productId, value) {
    setCounts({ ...counts, [productId]: value });
  }

  async function handleSaveCount() {
    try {
      // Validate that at least one product is counted
      const countedItems = Object.keys(counts).filter(key => counts[key] !== '');
      if (countedItems.length === 0) {
        setError('Please enter count for at least one item');
        setMessage('');
        return;
      }

      setSubmitting(true);
      setError('');

      // Prepare items for submission
      const items = products
        .filter(product => counts[product._id] != null && counts[product._id] !== '')
        .map(product => ({
          product: product._id,
          countedQuantity: Number(counts[product._id]),
          notes: '',
        }));

      const response = await axios.post(`${API_BASE_URL}/physical-counts/create`, {
        location: location || 'Main Warehouse',
        items,
        notes,
      });

      setSubmittedReference(response.data.data.referenceNumber);
      setMessage(`Physical count submitted successfully. Reference: ${response.data.data.referenceNumber}`);
      setCounts({});
      setLocation('');
      setNotes('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit physical count');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total Items</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Counted</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{summary.counted}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Matches</p>
          <p className="mt-4 text-4xl font-semibold text-emerald-600">{summary.matches}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Discrepancies</p>
          <p className="mt-4 text-4xl font-semibold text-rose-600">{summary.discrepancies}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Compare actual physical stock to system records</p>
            <h2 className="text-xl font-semibold text-slate-900">Physical Inventory Count</h2>
          </div>
          <button
            onClick={handleSaveCount}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-400"
          >
            {submitting ? 'Submitting...' : 'Submit Count'}
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Count Location</label>
                <input
                  type="text"
                  placeholder="e.g., Main Warehouse"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <input
                  type="text"
                  placeholder="Add any notes about this count"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">System Qty</th>
                  <th className="px-6 py-4 font-semibold">Actual Count</th>
                  <th className="px-6 py-4 font-semibold">Variance</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {countRows.map((row) => (
                  <tr key={row.product._id}>
                    <td className="px-6 py-4">{row.product.name}</td>
                    <td className="px-6 py-4">{row.product.category}</td>
                    <td className="px-6 py-4">{row.product.quantity}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        value={row.actual ?? ''}
                        onChange={(e) => handleCountChange(row.product._id, e.target.value)}
                        className="w-32 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
                      />
                    </td>
                    <td className="px-6 py-4">{row.variance != null ? `${row.variance >= 0 ? '+' : ''}${row.variance}` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === 'Match'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.status === 'Discrepancy'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {countRows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">
                      No products found for counting.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {message && <div className="rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
