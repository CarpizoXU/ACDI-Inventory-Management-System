const Product = require('../models/Product');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createProduct(productData) {
  const product = new Product(productData);
  return product.save();
}

async function listProducts({ search, category, stockStatus, page = 1, limit = 20 }) {
  const filters = { deletedAt: null };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filters.$or = [
      { name: regex },
      { sku: regex },
      { brand: regex },
      { vendor: regex },
    ];
  }

  if (category) {
    filters.category = category;
  }

  if (stockStatus) {
    filters.stockStatus = stockStatus;
  }

  const total = await Product.countDocuments(filters);
  const products = await Product.find(filters)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { products, total, page, limit };
}

async function findById(id) {
  return Product.findOne({ _id: id, deletedAt: null }).lean();
}

async function findByName(name) {
  const normalized = String(name || '').trim();
  if (!normalized) {
    return null;
  }

  return Product.findOne({
    deletedAt: null,
    name: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' },
  }).lean();
}

async function updateProduct(id, updateData) {
  return Product.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).lean();
}

async function archiveProduct(id) {
  return Product.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), status: 'archived' } },
    { new: true, runValidators: true },
  ).lean();
}

async function updateQuantity(id, quantity, stockStatus, updatedBy) {
  return Product.findByIdAndUpdate(
    id,
    { $set: { quantity, stockStatus, updatedBy, lastStockMovementDate: new Date() } },
    { new: true, runValidators: true },
  ).lean();
}

module.exports = {
  createProduct,
  listProducts,
  findById,
  findByName,
  updateProduct,
  archiveProduct,
  updateQuantity,
};
