import ExcelJS from 'exceljs';

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
];

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function convertNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function computeInventoryStatus(quantity, threshold) {
  if (quantity <= 0) {
    return 'Critical';
  }

  if (threshold <= 0) {
    return 'Good';
  }

  if (quantity <= Math.max(1, Math.floor(threshold / 2))) {
    return 'Critical';
  }

  if (quantity <= threshold) {
    return 'Low';
  }

  return 'Good';
}

function computePhysicalStatus(actual, systemQuantity) {
  if (actual === null || actual === undefined || actual === '') {
    return 'Pending';
  }

  return Number(actual) === Number(systemQuantity) ? 'Match' : 'Discrepancy';
}

function dateToMonthKey(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isCurrentWeek(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return target >= startOfWeek && target <= endOfWeek;
}

function isCurrentMonth(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  return now.getFullYear() === target.getFullYear() && now.getMonth() === target.getMonth();
}

function isCurrentYear(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  return now.getFullYear() === target.getFullYear();
}

function applyDateFilter(dateString, range) {
  if (!dateString || !range || range === 'All') {
    return true;
  }

  if (range === 'This Week') {
    return isCurrentWeek(dateString);
  }

  if (range === 'This Month') {
    return isCurrentMonth(dateString);
  }

  if (range === 'This Year') {
    return isCurrentYear(dateString);
  }

  return true;
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: EXCEL_MIME_TYPES[0] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function createWorkbook() {
  return new ExcelJS.Workbook();
}

function createInventoryWorksheet(workbook, products) {
  const sheet = workbook.addWorksheet('Inventory');
  const currentDate = new Date().toISOString().split('T')[0];

  sheet.columns = [
    { header: 'Item Name', key: 'name', width: 24 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Brand', key: 'brand', width: 18 },
    { header: 'Vendor', key: 'vendor', width: 18 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Min Threshold', key: 'reorderThreshold', width: 16 },
    { header: 'Unit Price', key: 'unitPrice', width: 14 },
    { header: 'Notes', key: 'notes', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Actual Count', key: 'actualCount', width: 14 },
    { header: 'Last Updated', key: 'updatedAt', width: 20 },
  ];

  products.forEach((product) => {
    sheet.addRow({
      name: product.name || '',
      category: product.category || '',
      brand: product.brand || '',
      vendor: product.vendor || '',
      unit: product.unit || 'pcs',
      quantity: product.quantity || 0,
      reorderThreshold: product.reorderThreshold || 0,
      unitPrice: product.unitPrice || 0,
      notes: product.notes || '',
      status: computeInventoryStatus(product.quantity || 0, product.reorderThreshold || 0),
      actualCount: '',
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate,
    });
  });

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Snapshot Date', key: 'snapshotDate', width: 18 },
    { header: 'Total Items', key: 'totalItems', width: 16 },
    { header: 'Total Quantity', key: 'totalQuantity', width: 16 },
    { header: 'Total Value', key: 'totalValue', width: 16 },
    { header: 'Low Items', key: 'lowItems', width: 12 },
    { header: 'Critical Items', key: 'criticalItems', width: 16 },
    { header: 'Out of Stock Items', key: 'outOfStockItems', width: 20 },
  ];

  const totalQuantity = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const totalValue = products.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.unitPrice || 0), 0);
  const lowItems = products.filter((product) => computeInventoryStatus(product.quantity || 0, product.reorderThreshold || 0) === 'Low').length;
  const criticalItems = products.filter((product) => computeInventoryStatus(product.quantity || 0, product.reorderThreshold || 0) === 'Critical').length;
  const outOfStockItems = products.filter((product) => Number(product.quantity || 0) === 0).length;

  summarySheet.addRow({
    snapshotDate: currentDate,
    totalItems: products.length,
    totalQuantity,
    totalValue,
    lowItems,
    criticalItems,
    outOfStockItems,
  });

  const monthlySheet = workbook.addWorksheet('Monthly Summary');
  monthlySheet.columns = [
    { header: 'Month', key: 'month', width: 14 },
    { header: 'Items Updated', key: 'itemsUpdated', width: 16 },
    { header: 'Total Quantity', key: 'totalQuantity', width: 16 },
  ];

  const monthlySummary = new Map();
  products.forEach((product) => {
    const key = dateToMonthKey(product.updatedAt);
    if (!monthlySummary.has(key)) {
      monthlySummary.set(key, { month: key, itemsUpdated: 0, totalQuantity: 0 });
    }

    const summaryEntry = monthlySummary.get(key);
    summaryEntry.itemsUpdated += 1;
    summaryEntry.totalQuantity += Number(product.quantity || 0);
  });

  monthlySummary.forEach((entry) => monthlySheet.addRow(entry));

  return sheet;
}

function createPhysicalCountWorksheet(workbook, products) {
  const sheet = workbook.addWorksheet('Physical Count');
  const currentDate = new Date().toISOString().split('T')[0];

  sheet.columns = [
    { header: 'Item Name', key: 'name', width: 24 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'System Quantity', key: 'systemQuantity', width: 16 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Actual Count', key: 'actualCount', width: 14 },
    { header: 'Variance', key: 'variance', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Notes', key: 'notes', width: 28 },
    { header: 'Count Date', key: 'countDate', width: 18 },
  ];

  products.forEach((product) => {
    sheet.addRow({
      name: product.name || '',
      category: product.category || '',
      systemQuantity: product.quantity || 0,
      unit: product.unit || 'pcs',
      actualCount: '',
      variance: 0,
      status: 'Pending',
      notes: '',
      countDate: currentDate,
    });
  });

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Snapshot Date', key: 'snapshotDate', width: 18 },
    { header: 'Total Lines', key: 'totalLines', width: 14 },
    { header: 'Pending', key: 'pending', width: 12 },
    { header: 'Matches', key: 'matches', width: 12 },
    { header: 'Discrepancies', key: 'discrepancies', width: 16 },
  ];

  summarySheet.addRow({
    snapshotDate: currentDate,
    totalLines: products.length,
    pending: products.length,
    matches: 0,
    discrepancies: 0,
  });

  return sheet;
}

async function readWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = createWorkbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

function getSheetRows(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    return [];
  }

  const headerRow = sheet.getRow(1);
  const headers = headerRow.values.slice(1).map((cell) => normalizeHeader(cell));

  return sheet.getRows(2, Math.max(sheet.rowCount - 1, 0)).map((row) => {
    const cells = row.values.slice(1);
    const rowObject = {};

    headers.forEach((header, index) => {
      rowObject[header] = cells[index] ?? '';
    });

    return rowObject;
  });
}

function parseInventoryImportRows(rows) {
  return rows
    .filter((row) => normalizeText(row.name || row['item name'] || row['item']) !== '')
    .map((row) => {
      const name = normalizeText(row.name || row['item name'] || row['item']);
      const category = normalizeText(row.category || row['cat']);
      const unit = normalizeText(row.unit || row['unit type'] || 'pcs');
      const quantity = convertNumber(row.quantity || row['qty'] || row['quantity']);
      const threshold = convertNumber(row['min threshold'] || row['reorder threshold'] || row['threshold']);
      const unitPrice = convertNumber(row['unit price'] || row['unitprice']);
      const notes = normalizeText(row.notes || row['note']);

      return {
        name,
        category,
        brand: normalizeText(row.brand || ''),
        vendor: normalizeText(row.vendor || ''),
        unit,
        quantity,
        reorderThreshold: threshold,
        unitPrice,
        notes,
        status: computeInventoryStatus(quantity, threshold),
      };
    });
}

function parsePhysicalCountImportRows(rows) {
  return rows
    .filter((row) => normalizeText(row.name || row['item name'] || row['item']) !== '')
    .map((row) => {
      const systemQuantity = convertNumber(row['system quantity'] || row['systemqty'] || row['system qty']);
      const actualCount = convertNumber(row['actual count'] || row['actualcount'] || row['counted']);
      const unit = normalizeText(row.unit || row['unit type'] || 'pcs');

      return {
        name: normalizeText(row.name || row['item name'] || row['item']),
        category: normalizeText(row.category || row['cat']),
        systemQuantity,
        actualCount,
        unit,
        notes: normalizeText(row.notes || row['note']),
      };
    });
}

export {
  applyDateFilter,
  computeInventoryStatus,
  computePhysicalStatus,
  createInventoryWorksheet,
  createPhysicalCountWorksheet,
  createWorkbook,
  downloadWorkbook,
  getSheetRows,
  parseInventoryImportRows,
  parsePhysicalCountImportRows,
  readWorkbook,
};
