const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    supplier: { type: String, trim: true, default: '' },
    receivedBy: { type: String, trim: true, default: '' },
    dateReceived: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, required: true, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Product', productSchema);
