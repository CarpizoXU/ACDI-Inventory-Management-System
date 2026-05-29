const express = require('express');
const { body } = require('express-validator');
const stockController = require('../controllers/stockController');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const movementValidation = [
  body('productId').isMongoId().withMessage('Valid productId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('note').optional().isString(),
  body('notes').optional().isString(),
  body('vendor').optional().isString(),
  body('receivedBy').optional().isString(),
  body('dateReceived').optional().isISO8601().withMessage('dateReceived must be a valid date'),
  body('voucherType').optional().isIn(['JV', 'CV']).withMessage('voucherType must be JV or CV'),
  body('voucherNumber').optional().isString(),
  body('issuedTo').optional().isString(),
  body('department').optional().isString(),
  body('dateIssued').optional().isISO8601().withMessage('dateIssued must be a valid date'),
  body('purpose').optional().isString(),
];

router.post('/stock-in', authorize(['admin', 'inventory_manager', 'staff']), movementValidation, stockController.stockIn);
router.post('/stock-out', authorize(['admin', 'inventory_manager', 'staff']), movementValidation, stockController.stockOut);

module.exports = router;
