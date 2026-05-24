const Transaction = require('../models/Transaction');

async function createTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  return transaction.save();
}

async function findTransactions({ productId, type, limit = 20 }) {
  const filters = {};

  if (productId) {
    filters.product = productId;
  }

  if (type) {
    filters.type = type;
  }

  const transactions = await Transaction.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('product', 'name category unit stockStatus')
    .lean();

  return { transactions, count: transactions.length };
}

module.exports = {
  createTransaction,
  findTransactions,
};
