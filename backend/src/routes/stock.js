const express = require('express');
const { body } = require('express-validator');
const stockController = require('../controllers/stockController');

const router = express.Router();

const movementValidation = [
  body('productId').isMongoId().withMessage('Valid productId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('performedBy').notEmpty().withMessage('performedBy is required'),
  body('note').optional().isString(),
];

router.post('/stock-in', movementValidation, stockController.stockIn);
router.post('/stock-out', movementValidation, stockController.stockOut);

module.exports = router;
