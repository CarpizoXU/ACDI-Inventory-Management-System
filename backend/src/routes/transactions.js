const express = require('express');
const { query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/',
  authorize(),
  [
    query('productId').optional().isMongoId().withMessage('Valid productId is required'),
    query('type').optional().isIn(['stock-in', 'stock-out', 'transfer', 'adjustment']).withMessage('Invalid transaction type'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  ],
  transactionController.listTransactions,
);

module.exports = router;
