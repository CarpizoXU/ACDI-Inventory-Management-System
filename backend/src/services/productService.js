const productRepository = require('../repositories/productRepository');

function computeStockStatus(quantity, threshold) {
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

async function createProduct(data) {
  const payload = {
    name: data.name,
    sku: data.sku,
    brand: data.brand,
    category: data.category,
    unit: data.unit,
    vendor: data.vendor,
    supplier: data.supplier,
    receivedBy: data.receivedBy,
    dateReceived: data.dateReceived || null,
    notes: data.notes,
    quantity: data.quantity ?? 0,
    reorderThreshold: data.reorderThreshold ?? 0,
    unitPrice: data.unitPrice ?? 0,
    voucherType: data.voucherType || '',
    voucherNumber: data.voucherNumber || '',
    status: data.status || 'active',
    stockStatus: computeStockStatus(data.quantity ?? 0, data.reorderThreshold ?? 0),
    createdBy: data.createdBy || '',
    updatedBy: data.updatedBy || '',
  };

  return productRepository.createProduct(payload);
}

async function listProducts(filters) {
  return productRepository.listProducts(filters);
}

async function getProductById(id) {
  const product = await productRepository.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
}

async function updateProduct(id, updates) {
  const existing = await productRepository.findById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const quantity = updates.quantity != null ? updates.quantity : existing.quantity;
  const threshold = updates.reorderThreshold != null ? updates.reorderThreshold : existing.reorderThreshold;

  const payload = {
    ...updates,
    stockStatus: computeStockStatus(quantity, threshold),
  };

  return productRepository.updateProduct(id, payload);
}

async function archiveProduct(id) {
  const existing = await productRepository.findById(id);
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return productRepository.archiveProduct(id);
}

async function updateQuantityAndStatus(product, quantity, updatedBy) {
  const stockStatus = computeStockStatus(quantity, product.reorderThreshold);
  return productRepository.updateQuantity(product._id, quantity, stockStatus, updatedBy);
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  updateQuantityAndStatus,
};
