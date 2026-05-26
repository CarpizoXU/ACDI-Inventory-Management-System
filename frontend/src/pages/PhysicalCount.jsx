import { useEffect, useMemo, useState } from 'react';
import productService from '../services/productService';
import physicalCountService from '../services/physicalCountService';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  applyDateFilter,
  createPhysicalCountWorksheet,
  createWorkbook,
  downloadWorkbook,
  getSheetRows,
  parsePhysicalCountImportRows,
  readWorkbook,
} from '../utils/excelUtils';

function computeCurrentStatus(actual, systemQuantity) {
  if (actual === null || actual === undefined || actual === '') {
    return 'Pending';
  }

  return Number(actual) === Number(systemQuantity) ? 'Match' : 'Discrepancy';
}

function getReportStatus(items) {
  if (!items?.length) {
    return 'Pending';
  }

  if (items.some((item) => item.countedQuantity == null || item.countedQuantity === '')) {
    return 'Pending';
  }

  if (items.some((item) => item.variance !== 0)) {
    return 'Discrepancy';
  }

  return 'Match';
}

export default function PhysicalCountPage() {
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);
  const [dateRange, setDateRange] = useState('All');

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))];
  }, [products]);

  const countRows = useMemo(() => {
    return products.map((product) => {
      const rawActual = counts[product._id];
      const actual = rawActual === '' || rawActual == null ? null : Number(rawActual);
      const variance = actual == null ? null : actual - Number(product.quantity || 0);
      const status = computeCurrentStatus(actual, product.quantity);

      return {
        product,
        actual,
        variance,
        status,
      };
    });
  }, [products, counts]);

  const filteredCountRows = useMemo(() => {
    return countRows.filter((row) => {
      const matchesCategory = !categoryFilter || row.product.category === categoryFilter;
      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesDiscrepancy = !showDiscrepanciesOnly || row.status === 'Discrepancy';
      return matchesCategory && matchesStatus && matchesDiscrepancy;
    });
  }, [countRows, categoryFilter, statusFilter, showDiscrepanciesOnly]);

  const summary = useMemo(() => {
    const total = countRows.length;
    const counted = countRows.filter((row) => row.actual != null).length;
    const matches = countRows.filter((row) => row.status === 'Match').length;
    const discrepancies = countRows.filter((row) => row.status === 'Discrepancy').length;
    return { total, counted, matches, discrepancies };
  }, [countRows]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesDate = applyDateFilter(report.createdAt, dateRange);
      const reportStatus = getReportStatus(report.items);
      const matchesStatus = !statusFilter || reportStatus === statusFilter;
      const matchesCategory = !categoryFilter || report.items.some((item) => item.product?.category === categoryFilter);
      const matchesDiscrepancy = !showDiscrepanciesOnly || reportStatus === 'Discrepancy';

      return matchesDate && matchesStatus && matchesCategory && matchesDiscrepancy;
    });
  }, [reports, categoryFilter, statusFilter, showDiscrepanciesOnly, dateRange]);

  const selectedReport = useMemo(() => {
    return reports.find((report) => report._id === selectedReportId) || null;
  }, [reports, selectedReportId]);

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

  async function loadReports() {
    try {
      setReportsLoading(true);
      const response = await physicalCountService.listPhysicalCounts();
      setReports(response.data.data || []);
    } catch (err) {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadReports();
  }, []);

  function handleCountChange(productId, value) {
    setCounts((current) => ({ ...current, [productId]: value }));
  }

  async function handleExportTemplate() {
    const workbook = createWorkbook();
    createPhysicalCountWorksheet(workbook, products);
    await downloadWorkbook(workbook, `ACDI_PhysicalCount_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  async function handleImportCount(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      setError('');
      setMessage('');

      const workbook = await readWorkbook(file);
      const rows = getSheetRows(workbook, 'Physical Count');
      const parsedRows = parsePhysicalCountImportRows(rows);

      if (!parsedRows.length) {
        throw new Error('No importable rows were found in the workbook.');
      }

      const importMap = new Map();
      parsedRows.forEach((row) => {
        const product = products.find((item) => {
          const sameName = item.name?.toLowerCase() === row.name.toLowerCase();
          const sameCategory = !row.category || item.category?.toLowerCase() === row.category.toLowerCase();
          return sameName && sameCategory;
        });

        if (!product) {
          throw new Error(`Unable to match item "${row.name}" in the current inventory.`);
        }

        importMap.set(product._id, {
          ...row,
          actualCount: Number(row.actualCount || 0),
        });
      });

      const nextCounts = {};
      importMap.forEach((row, productId) => {
        nextCounts[productId] = row.actualCount;
      });

      setCounts(nextCounts);
      setMessage(`Imported ${importMap.size} count entries. Review the values and submit to save the report.`);
    } catch (err) {
      setError(err.message || 'Unable to import physical count data');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  async function handleSaveCount() {
    try {
      const countedItems = Object.keys(counts).filter((key) => counts[key] !== '' && counts[key] != null);
      if (countedItems.length === 0) {
        setError('Please enter count for at least one item');
        setMessage('');
        return;
      }

      setSubmitting(true);
      setError('');

      const items = products
        .filter((product) => counts[product._id] !== '' && counts[product._id] != null)
        .map((product) => ({
          product: product._id,
          countedQuantity: Number(counts[product._id]),
          notes: '',
        }));

      const response = await physicalCountService.createPhysicalCount({
        location: location || 'Main Warehouse',
        items,
        notes,
      });

      setMessage(`Physical count saved successfully. Reference: ${response.data.data.referenceNumber}`);
      setCounts({});
      setLocation('');
      setNotes('');
      await loadReports();
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
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">Compare actual physical stock to system records</p>
            <h2 className="text-xl font-semibold text-slate-900">Physical Inventory Count</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportTemplate}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Export Sheet
            </button>
            <label className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700">
              <span>{importing ? 'Importing…' : 'Import Count'}</span>
              <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleImportCount} className="hidden" />
            </label>
            <button
              onClick={handleSaveCount}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-slate-400"
            >
              {submitting ? 'Saving...' : 'Submit Count'}
            </button>
          </div>
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

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                <option value="Pending">Pending</option>
                <option value="Match">Match</option>
                <option value="Discrepancy">Discrepancy</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showDiscrepanciesOnly}
                  onChange={(e) => setShowDiscrepanciesOnly(e.target.checked)}
                />
                Show only discrepancies
              </label>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Unit</th>
                    <th className="px-6 py-4 font-semibold">System Qty</th>
                    <th className="px-6 py-4 font-semibold">Actual Count</th>
                    <th className="px-6 py-4 font-semibold">Variance</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredCountRows.map((row) => (
                    <tr key={row.product._id}>
                      <td className="px-6 py-4">{row.product.name}</td>
                      <td className="px-6 py-4">{row.product.category}</td>
                      <td className="px-6 py-4">{row.product.unit || 'pcs'}</td>
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
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            row.status === 'Match'
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.status === 'Discrepancy'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCountRows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">
                        No products match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Review saved count reports</p>
            <h2 className="text-xl font-semibold text-slate-900">Count report log</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 sm:w-48"
            >
              <option value="All">All Dates</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 sm:w-44"
            >
              <option value="">All Report Status</option>
              <option value="Pending">Pending</option>
              <option value="Match">Match</option>
              <option value="Discrepancy">Discrepancy</option>
            </select>
          </div>
        </div>

        {reportsLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Reference</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Counted By</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Discrepancies</th>
                    <th className="px-6 py-4 font-semibold">Notes</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredReports.map((report) => {
                    const reportStatus = getReportStatus(report.items);
                    const discrepancyCount = report.items.filter((item) => item.variance !== 0).length;

                    return (
                      <tr key={report._id}>
                        <td className="px-6 py-4">{new Date(report.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4">{report.referenceNumber}</td>
                        <td className="px-6 py-4">{report.location || 'Main Warehouse'}</td>
                        <td className="px-6 py-4">{report.countedBy}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              reportStatus === 'Match'
                                ? 'bg-emerald-100 text-emerald-700'
                                : reportStatus === 'Discrepancy'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {reportStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">{discrepancyCount}</td>
                        <td className="px-6 py-4 max-w-xs break-words">{report.notes || '—'}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedReportId(report._id)}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No physical count reports match the current filters.</div>
              )}
            </div>

            {selectedReport && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Report details: {selectedReport.referenceNumber}</p>
                    <p className="text-sm text-slate-500">{selectedReport.location || 'Main Warehouse'} • {new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReportId(null)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    Close
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Item</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Unit</th>
                        <th className="px-4 py-3 font-semibold">System Qty</th>
                        <th className="px-4 py-3 font-semibold">Actual Count</th>
                        <th className="px-4 py-3 font-semibold">Variance</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedReport.items.map((item) => {
                        const status = computeCurrentStatus(item.countedQuantity, item.systemQuantity);
                        return (
                          <tr key={`${selectedReport._id}-${item.product?._id || item.product}`}>
                            <td className="px-4 py-3">{item.product?.name || 'Unknown'}</td>
                            <td className="px-4 py-3">{item.product?.category || '—'}</td>
                            <td className="px-4 py-3">{item.product?.unit || 'pcs'}</td>
                            <td className="px-4 py-3">{item.systemQuantity}</td>
                            <td className="px-4 py-3">{item.countedQuantity}</td>
                            <td className="px-4 py-3">{item.variance >= 0 ? `+${item.variance}` : item.variance}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === 'Match' ? 'bg-emerald-100 text-emerald-700' : status === 'Discrepancy' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs break-words">{item.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {message && <div className="rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
