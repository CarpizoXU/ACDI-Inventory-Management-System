const Transaction = require('../models/Transaction');

async function createTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  return transaction.save();
}

module.exports = {
  createTransaction,
};
