import { useEffect, useMemo, useState } from 'react';
import { FiArrowDownCircle, FiCalendar, FiClipboard, FiPackage, FiTruck, FiUser } from 'react-icons/fi';
import stockService from '../services/stockService';
import transactionService from '../services/transactionService';
import productService from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  productId: '',
  quantity: 1,
  vendor: '',
  receivedBy: '',
  dateReceived: '',
  voucherType: '',
  voucherNumber: '',
  notes: '',
};

function formatQuantity(quantity, unit) {
  return `${quantity} ${unit || 'pcs'}`;
}

function formatValue(value) {
  if (!value) {
    return '—';
  }

  return `${value}`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString();
}

export default function StockInPage() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === form.productId),
    [products, form.productId],
  );

  async function loadData() {
    try {
      setLoading(true);
      const [productsResponse, transactionsResponse] = await Promise.all([
        productService.listProducts({ limit: 100 }),
        transactionService.getTransactions({ type: 'stock-in', limit: 10 }),
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

  function openModal() {
    setMessage('');
    setError('');
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleQuantityChange(value) {
    if (value === '') {
      setForm((current) => ({ ...current, quantity: '' }));
      return;
    }

    const parsed = Number(value);
    setForm((current) => ({
      ...current,
      quantity: Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1,
    }));
  }

  function handleVoucherNumberChange(value) {
    setForm((current) => ({
      ...current,
      voucherNumber: value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!form.productId) {
      setError('Please select an item to receive.');
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    if (form.voucherType && !form.voucherNumber.trim()) {
      setError('Please enter the JV/CV number when a voucher type is selected.');
      return;
    }

    if (!form.voucherType && form.voucherNumber.trim()) {
      setError('Please select JV or CV before entering a voucher number.');
      return;
    }

    try {
      setSaving(true);
      await stockService.stockIn({
        productId: form.productId,
        quantity,
        performedBy: user?.name || user?.email || 'system',
        note: form.notes.trim(),
        vendor: form.vendor.trim(),
        receivedBy: form.receivedBy.trim(),
        dateReceived: form.dateReceived || null,
        voucherType: form.voucherType,
        voucherNumber: form.voucherNumber.trim(),
      });

      setMessage('Stock in recorded successfully');
      setIsModalOpen(false);
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to record stock in');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
              <FiArrowDownCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Record incoming inventory items</p>
              <h2 className="text-xl font-semibold text-slate-900">Stock In</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            + Record Stock In
          </button>
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
                  <th className="px-6 py-4 font-semibold">Supplier</th>
                  <th className="px-6 py-4 font-semibold">Received By</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4 font-semibold">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {transactions.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4">{item.product?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">{item.product?.category || '-'}</td>
                    <td className="px-6 py-4">{formatQuantity(item.quantity, item.product?.unit)}</td>
                    <td className="px-6 py-4">{formatValue(item.vendor)}</td>
                    <td className="px-6 py-4">{formatValue(item.receivedBy)}</td>
                    <td className="px-6 py-4">{formatDate(item.dateReceived || item.createdAt)}</td>
                    <td className="px-6 py-4 max-w-xs break-words">{formatValue(item.note)}</td>
                    <td className="px-6 py-4">{formatValue(item.performedBy)}</td>
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

      <Modal open={isModalOpen} onClose={closeModal} title="Record Stock In">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-500">Performed by: {user?.name || user?.email || 'system'}</p>

          {message && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <label className="block text-sm font-medium text-slate-700">
            Item Name
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                  {product.brand || product.vendor ? ` — ${[product.brand, product.vendor].filter(Boolean).join(' / ')}` : ''}
                </option>
              ))}
            </select>
          </label>
          {selectedProduct && (
            <p className="text-xs text-slate-500">Selected unit: {selectedProduct.unit || 'pcs'}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Quantity
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Vendor
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Received By
              <input
                value={form.receivedBy}
                onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date Received
              <input
                type="date"
                value={form.dateReceived}
                onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Voucher reference</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {['JV', 'CV'].map((type) => (
                <label key={type} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="voucherType"
                    checked={form.voucherType === type}
                    onChange={() => setForm((current) => ({ ...current, voucherType: type }))}
                  />
                  {type}
                </label>
              ))}
            </div>
            <input
              value={form.voucherNumber}
              onChange={(e) => handleVoucherNumberChange(e.target.value)}
              placeholder="Enter JV/CV number"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
            />
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-2 h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Submit Stock In'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
