import { useEffect, useMemo, useState } from 'react';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import {
  applyDateFilter,
  computeInventoryStatus,
  createInventoryWorksheet,
  createWorkbook,
  downloadWorkbook,
  getSheetRows,
  parseInventoryImportRows,
  readWorkbook,
} from '../utils/excelUtils';

const initialForm = {
  name: '',
  category: '',
  brand: '',
  vendor: '',
  unit: 'pcs',
  unitPrice: '',
  quantity: '',
  reorderThreshold: '',
  voucherType: '',
  voucherNumber: '',
  notes: '',
};

const modalTitleMap = {
  create: 'Add new item',
  edit: 'Edit item',
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
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function getStatusLabel(stockStatus) {
  if (stockStatus === 'alert') {
    return 'Low';
  }

  if (stockStatus === 'critical' || stockStatus === 'out-of-stock') {
    return 'Critical';
  }

  return 'Good';
}

function getApiErrorMessage(err) {
  const responseData = err?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    const firstError = responseData.errors[0];
    return firstError?.msg || firstError?.message || responseData.message || 'Unable to process the request';
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return 'Unable to process the request';
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [dateRange, setDateRange] = useState('All');
  const [importing, setImporting] = useState(false);
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

  const units = useMemo(() => {
    return [...new Set(products.map((item) => item.unit).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch = !normalizedSearch || product.name?.toLowerCase().includes(normalizedSearch);
      const matchesCategory = !category || product.category === category;
      const matchesStatus = !statusFilter || getStatusLabel(product.stockStatus) === statusFilter;
      const matchesUnit = !unitFilter || product.unit === unitFilter;
      const matchesDate = applyDateFilter(product.updatedAt, dateRange);

      return matchesSearch && matchesCategory && matchesStatus && matchesUnit && matchesDate;
    });

    const sorted = [...filtered];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'quantity') {
      sorted.sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    return sorted;
  }, [products, search, category, statusFilter, unitFilter, sortBy, dateRange]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await productService.listProducts({
        search,
        category,
        stockStatus: statusFilter === '' ? undefined : statusFilter === 'Good' ? 'ok' : statusFilter === 'Low' ? 'alert' : 'critical',
        limit: 100,
      });
      setProducts(response.data.data.products || []);
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Failed to load products');
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
  }, [search, category, statusFilter]);

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
      unitPrice: String(clampNonNegative(product.unitPrice)),
      quantity: String(clampNonNegative(product.quantity)),
      reorderThreshold: String(clampNonNegative(product.reorderThreshold)),
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
    // allow clearing the input while enforcing non-negative numeric values otherwise
    if (value === '' || value === null) {
      setForm((current) => ({ ...current, [field]: '' }));
      return;
    }

    if (field === 'unitPrice') {
      setForm((current) => ({ ...current, [field]: clampNonNegative(value) }));
    } else {
      const parsed = Math.floor(clampNonNegative(value));
      setForm((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
    }
  }

  async function handleExportInventory() {
    const workbook = createWorkbook();
    createInventoryWorksheet(workbook, products);
    await downloadWorkbook(workbook, `ACDI_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  async function handleImportInventory(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      setError('');
      setSuccess('');

      const workbook = await readWorkbook(file);
      const rows = getSheetRows(workbook, 'Inventory');
      const parsedRows = parseInventoryImportRows(rows);

      if (!parsedRows.length) {
        throw new Error('No importable rows were found in the workbook.');
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const row of parsedRows) {
        if (!row.name || !row.category || !row.unit) {
          throw new Error('Each imported row must include a name, category, and unit.');
        }

        const match = products.find((product) => {
          return product.name?.toLowerCase() === row.name.toLowerCase() && product.category?.toLowerCase() === row.category.toLowerCase();
        });

        const payload = {
          ...row,
          quantity: Math.floor(clampNonNegative(row.quantity)),
          reorderThreshold: Math.floor(clampNonNegative(row.reorderThreshold)),
          unitPrice: clampNonNegative(row.unitPrice),
          notes: row.notes || '',
          status: 'active',
        };

        if (match?._id) {
          await productService.updateProduct(match._id, payload);
          updatedCount += 1;
        } else {
          await productService.createProduct(payload);
          createdCount += 1;
        }
      }

      setSuccess(`Imported inventory successfully. Created ${createdCount} item(s) and updated ${updatedCount} item(s).`);
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Unable to import inventory data');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
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
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err) || (modalMode === 'edit' ? 'Unable to update product' : 'Unable to add product'));
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
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Unable to delete product');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Inventory list</p>
          <h2 className="text-xl font-semibold text-slate-900">Product catalog</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportInventory}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Export Excel
          </button>
          <label className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            <span>{importing ? 'Importing…' : 'Import Excel'}</span>
            <input
              type="file"
              accept=".xlsx,.xlsm,.xls"
              onChange={handleImportInventory}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            + Add New Item
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item name"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        >
          <option value="">All Categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        >
          <option value="">All Status</option>
          <option value="Good">Good</option>
          <option value="Low">Low</option>
          <option value="Critical">Critical</option>
        </select>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        >
          <option value="">All Units</option>
          {units.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        >
          <option value="updatedAt">Sort by Last Updated</option>
          <option value="name">Sort by Name A–Z</option>
          <option value="quantity">Sort by Quantity (Low to High)</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
        >
          <option value="All">All Dates</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
        </select>
      </div>

      {success && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Item Name</th>
                <th className="px-6 py-4 font-semibold">Brand</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Threshold</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Movement</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredProducts.map((product) => (
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
                  <td className="px-6 py-4">{product.brand || '—'}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.quantity} {product.unit}</td>
                  <td className="px-6 py-4">{product.reorderThreshold}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        product.stockStatus === 'critical' || product.stockStatus === 'out-of-stock'
                          ? 'bg-rose-100 text-rose-700'
                          : product.stockStatus === 'alert'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {getStatusLabel(product.stockStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.lastStockMovementDate
                      ? new Date(product.lastStockMovementDate).toLocaleDateString()
                      : 'No Movement'}
                  </td>
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
          {filteredProducts.length === 0 && (
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
              Item Name *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category *
              <div className="relative mt-2">
                <input
                  list="category-options"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Select or type new category"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
                <datalist id="category-options">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
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
              Vendor *
              <input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Unit *
              <div className="relative mt-2">
                <input
                  list="unit-options"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Select or type new unit"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
                <datalist id="unit-options">
                  {units.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Unit Price *
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
              Quantity *
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
              Threshold *
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
            <p className="text-sm font-medium text-slate-700">Voucher Reference *</p>
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
            <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700">{modalMode === 'edit' ? 'Save Changes' : 'Add Item'}</button>
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
                <p className="mt-1 text-sm text-slate-800">{getStatusLabel(detailsProduct.stockStatus)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Voucher</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.voucherType || '—'} {detailsProduct.voucherNumber || ''}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Brand</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.brand || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Supplier</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.supplier || detailsProduct.vendor || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Date Received</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.dateReceived ? formatDate(detailsProduct.dateReceived) : '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last Stock Movement</p>
                <p className="mt-1 text-sm text-slate-800">
                  {detailsProduct.lastStockMovementDate ? formatDate(detailsProduct.lastStockMovementDate) : 'No Movement'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created By</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.createdBy || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created Date</p>
                <p className="mt-1 text-sm text-slate-800">{formatDate(detailsProduct.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated By</p>
                <p className="mt-1 text-sm text-slate-800">{detailsProduct.updatedBy || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated Date</p>
                <p className="mt-1 text-sm text-slate-800">{formatDate(detailsProduct.updatedAt)}</p>
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