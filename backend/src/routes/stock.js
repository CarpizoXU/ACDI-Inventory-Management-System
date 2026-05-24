const express = require('express');
const { body } = require('express-validator');
const stockController = require('../controllers/stockController');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const movementValidation = [
  body('productId').isMongoId().withMessage('Valid productId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('note').optional().isString(),
];

router.post('/stock-in', authorize(['admin', 'inventory_manager', 'staff']), movementValidation, stockController.stockIn);
router.post('/stock-out', authorize(['admin', 'inventory_manager', 'staff']), movementValidation, stockController.stockOut);

module.exports = router;
