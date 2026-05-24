const transactionRepository = require('../repositories/transactionRepository');

async function listTransactions(filters) {
  return transactionRepository.findTransactions(filters);
}

module.exports = {
  listTransactions,
};
