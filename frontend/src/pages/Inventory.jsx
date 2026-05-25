import { useEffect, useMemo, useState } from 'react';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const initialForm = {
  name: '',
  category: '',
  brand: '',
  vendor: '',
  unit: 'pcs',
  unitPrice: 0,
  quantity: 0,
  reorderThreshold: 0,
  voucherType: '',
  voucherNumber: '',
  notes: '',
};

const modalTitleMap = {
  create: 'Add new product',
  edit: 'Edit product',
};

function clampNonNegative(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState(initialForm);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const categories = useMemo(() => {
    return [...new Set(products.map((item) => item.category).filter(Boolean))];
  }, [products]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await productService.listProducts({ search, category, limit: 50 });
      setProducts(response.data.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs(productId) {
    try {
      setLogsLoading(true);
      const response = await transactionService.getTransactions({ productId, limit: 10 });
      setLogs(response.data.data.transactions || []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [search, category]);

  function openCreateModal() {
    setError('');
    setSuccess('');
    setModalMode('create');
    setEditingProduct(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setError('');
    setSuccess('');
    setModalMode('edit');
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      brand: product.brand || '',
      vendor: product.vendor || '',
      unit: product.unit || 'pcs',
      unitPrice: clampNonNegative(product.unitPrice),
      quantity: clampNonNegative(product.quantity),
      reorderThreshold: clampNonNegative(product.reorderThreshold),
      voucherType: product.voucherType || '',
      voucherNumber: product.voucherNumber || '',
      notes: product.notes || '',
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function openDetails(product) {
    setDetailsProduct(product);
    setLogs([]);
    loadLogs(product._id);
  }

  function handleNumericChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: field === 'unitPrice' ? clampNonNegative(value) : Math.floor(clampNonNegative(value)),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess('');
    setError('');

    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) {
      setError('Please fill in the item name, category, and unit.');
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

    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      vendor: form.vendor.trim(),
      unit: form.unit.trim(),
      unitPrice: clampNonNegative(form.unitPrice),
      quantity: Math.floor(clampNonNegative(form.quantity)),
      reorderThreshold: Math.floor(clampNonNegative(form.reorderThreshold)),
      voucherType: form.voucherType || '',
      voucherNumber: form.voucherNumber.trim(),
      notes: form.notes.trim(),
    };

    try {
      if (modalMode === 'edit' && editingProduct?._id) {
        await productService.updateProduct(editingProduct._id, payload);
        setSuccess('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        setSuccess('Product added successfully');
      }

      setForm(initialForm);
      setEditingProduct(null);
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || (modalMode === 'edit' ? 'Unable to update product' : 'Unable to add product'));
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await productService.archiveProduct(productId);
      setSuccess('Product deleted successfully');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Inventory list</p>
          <h2 className="text-xl font-semibold text-slate-900">Product catalog</h2>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + Add New Product
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 sm:w-72"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 sm:w-56"
        >
          <option value="">All Categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {success && <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Item Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Threshold</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Updated</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => openDetails(product)}
                      className="text-left font-semibold text-sky-700 hover:underline"
                    >
                      {product.name}
                    </button>
                  </td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.quantity} {product.unit}</td>
                  <td className="px-6 py-4">{product.reorderThreshold}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        product.stockStatus === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : product.stockStatus === 'alert'
                          ? 'bg-amber-100 text-amber-700'
                          : product.stockStatus === 'out-of-stock'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stockStatus.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openDetails(product)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">No products found.</div>
          )}
        </div>
      )}

      <Modal open={isModalOpen} onClose={closeModal} title={modalTitleMap[modalMode]}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {success && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Item Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Brand
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
              Unit
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Unit Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => handleNumericChange('unitPrice', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Quantity
              <input
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(e) => handleNumericChange('quantity', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Threshold
              <input
                type="number"
                min="0"
                step="1"
                value={form.reorderThreshold}
                onChange={(e) => handleNumericChange('reorderThreshold', e.target.value)}
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
              onChange={(e) => setForm({ ...form, voucherNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
              placeholder="Enter JV/CV number"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
            />
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
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
              className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              {modalMode === 'edit' ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detailsProduct)} onClose={() => setDetailsProduct(null)} title={detailsProduct?.name || 'Product details'}>
        {detailsProduct && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Unit</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.unit}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Unit Price</p>
                <p className="mt-1 text-sm text-slate-800">₱{formatNumber(detailsProduct.unitPrice)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Quantity</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.quantity}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Reorder Threshold</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.reorderThreshold}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.stockStatus?.replace('-', ' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Voucher</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.voucherType || '—'} {detailsProduct.voucherNumber || ''}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Brand / Vendor</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.brand || '—'} / {detailsProduct.vendor || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Notes</p>
              <p className="mt-1 text-sm text-slate-800">{detailsProduct.notes || 'No notes added.'}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Stock movement logs</p>
                <span className="text-xs text-slate-500">Most recent 10</span>
              </div>
              {logsLoading ? (
                <LoadingSpinner />
              ) : logs.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No movement logs found for this item.</p>
              ) : (
                <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Reference</th>
                        <th className="px-4 py-3 font-semibold">By</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {logs.map((entry) => (
                        <tr key={entry._id}>
                          <td className="px-4 py-3 capitalize">{entry.type.replace('-', ' ')}</td>
                          <td className="px-4 py-3">{entry.quantity}</td>
                          <td className="px-4 py-3">{entry.referenceNumber}</td>
                          <td className="px-4 py-3">{entry.performedBy}</td>
                          <td className="px-4 py-3">{formatDate(entry.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDetailsProduct(null);
                  openEditModal(detailsProduct);
                }}
                className="rounded-2xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700"
              >
                Edit item
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailsProduct(null);
                  handleDelete(detailsProduct._id);
                }}
                className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Delete item
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}