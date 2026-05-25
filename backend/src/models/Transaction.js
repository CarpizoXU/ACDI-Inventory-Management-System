const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      enum: ['stock-in', 'stock-out', 'transfer', 'adjustment'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    referenceNumber: { type: String, required: true, unique: true },
    performedBy: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
