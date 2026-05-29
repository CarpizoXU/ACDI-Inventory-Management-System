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
    vendor: { type: String, trim: true, default: '' },
    receivedBy: { type: String, trim: true, default: '' },
    dateReceived: { type: Date, default: null },
    voucherType: { type: String, enum: ['JV', 'CV', ''], default: '' },
    voucherNumber: { type: String, trim: true, default: '' },
    issuedTo: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    dateIssued: { type: Date, default: null },
    purpose: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
