const Product = require('../models/Product');

async function createProduct(productData) {
  const product = new Product(productData);
  return product.save();
}

async function findById(id) {
  return Product.findOne({ _id: id, deletedAt: null }).lean();
}

async function updateQuantity(id, quantity) {
  return Product.findByIdAndUpdate(
    id,
    { $set: { quantity } },
    { new: true, runValidators: true },
  );
}

module.exports = {
  createProduct,
  findById,
  updateQuantity,
};
