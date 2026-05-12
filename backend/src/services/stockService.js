const productRepository = require('../repositories/productRepository');
const transactionRepository = require('../repositories/transactionRepository');

function buildReferenceNumber(type) {
  const now = Date.now();
  const timestamp = now.toString().slice(-8);
  return `${type.toUpperCase()}-${timestamp}`;
}

async function recordStockIn({ productId, quantity, performedBy, note }) {
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
  await productRepository.updateQuantity(productId, updatedQuantity);

  const transaction = await transactionRepository.createTransaction({
    product: productId,
    type: 'stock-in',
    quantity,
    referenceNumber: buildReferenceNumber('stock-in'),
    performedBy,
    note,
  });

  return {
    product: { ...product, quantity: updatedQuantity },
    transaction,
  };
}

async function recordStockOut({ productId, quantity, performedBy, note }) {
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
  await productRepository.updateQuantity(productId, updatedQuantity);

  const transaction = await transactionRepository.createTransaction({
    product: productId,
    type: 'stock-out',
    quantity,
    referenceNumber: buildReferenceNumber('stock-out'),
    performedBy,
    note,
  });

  return {
    product: { ...product, quantity: updatedQuantity },
    transaction,
  };
}

module.exports = {
  recordStockIn,
  recordStockOut,
};
