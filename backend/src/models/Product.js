const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    brand: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    vendor: { type: String, trim: true, default: '' },
    supplier: { type: String, trim: true, default: '' },
    receivedBy: { type: String, trim: true, default: '' },
    dateReceived: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, required: true, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    voucherType: { type: String, enum: ['JV', 'CV', ''], default: '' },
    voucherNumber: { type: String, trim: true, default: '' },
    stockStatus: {
      type: String,
      enum: ['ok', 'alert', 'critical', 'out-of-stock'],
      default: 'ok',
    },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    createdBy: { type: String, trim: true, default: '' },
    updatedBy: { type: String, trim: true, default: '' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
