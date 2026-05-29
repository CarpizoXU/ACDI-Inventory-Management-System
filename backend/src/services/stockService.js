const productRepository = require('../repositories/productRepository');
const transactionRepository = require('../repositories/transactionRepository');

function buildReferenceNumber(type) {
  const now = Date.now();
  const timestamp = now.toString().slice(-8);
  return `${type.toUpperCase()}-${timestamp}`;
}

function determineStockStatus(quantity, threshold) {
  if (quantity === 0) {
    return 'out-of-stock';
  }

  if (threshold <= 0) {
    return 'ok';
  }

  if (quantity <= Math.max(1, Math.floor(threshold / 2))) {
    return 'critical';
  }

  if (quantity <= threshold) {
    return 'alert';
  }

  return 'ok';
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function recordStockIn({
  productId,
  quantity,
  performedBy,
  note,
  vendor,
  receivedBy,
  dateReceived,
  voucherType,
  voucherNumber,
}) {
  if (!quantity || quantity <= 0) {
    const error = new Error('Quantity must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedQuantity = product.quantity + quantity;
  const stockStatus = determineStockStatus(updatedQuantity, product.reorderThreshold);
  const updatedProduct = await productRepository.updateQuantity(productId, updatedQuantity, stockStatus, performedBy);

  const transaction = await transactionRepository.createTransaction({
    product: productId,
    type: 'stock-in',
    quantity,
    referenceNumber: buildReferenceNumber('stock-in'),
    performedBy,
    note: note || '',
    vendor: vendor || '',
    receivedBy: receivedBy || '',
    dateReceived: normalizeDate(dateReceived),
    voucherType: voucherType || '',
    voucherNumber: voucherNumber || '',
  });

  return {
    product: updatedProduct,
    transaction,
  };
}

async function recordStockOut({
  productId,
  quantity,
  performedBy,
  note,
  issuedTo,
  department,
  dateIssued,
  purpose,
}) {
  if (!quantity || quantity <= 0) {
    const error = new Error('Quantity must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (product.quantity < quantity) {
    const error = new Error('Insufficient product quantity');
    error.statusCode = 400;
    throw error;
  }

  const updatedQuantity = product.quantity - quantity;
  const stockStatus = determineStockStatus(updatedQuantity, product.reorderThreshold);
  const updatedProduct = await productRepository.updateQuantity(productId, updatedQuantity, stockStatus, performedBy);

  const transaction = await transactionRepository.createTransaction({
    product: productId,
    type: 'stock-out',
    quantity,
    referenceNumber: buildReferenceNumber('stock-out'),
    performedBy,
    note: note || '',
    issuedTo: issuedTo || '',
    department: department || '',
    dateIssued: normalizeDate(dateIssued),
    purpose: purpose || '',
  });

  return {
    product: updatedProduct,
    transaction,
  };
}

module.exports = {
  recordStockIn,
  recordStockOut,
};
