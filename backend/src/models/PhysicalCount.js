const mongoose = require('mongoose');

const physicalCountItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  countedQuantity: { type: Number, required: true, min: 0 },
  systemQuantity: { type: Number, required: true, min: 0 },
  variance: { type: Number, required: true },
  notes: { type: String, default: '' },
});

const physicalCountSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    countedBy: { type: String, required: true },
    location: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reconciled'],
      default: 'draft',
    },
    items: [physicalCountItemSchema],
    totalVariance: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    reconciledAt: { type: Date, default: null },
    reconciledBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhysicalCount', physicalCountSchema);
