const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/',
  authorize(),
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1 })],
  productController.listProducts,
);

router.get('/:id', authorize(), [param('id').isMongoId().withMessage('Valid product id is required')], productController.getProductById);

router.post(
  '/',
  authorize(['admin', 'inventory_manager']),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('unit').notEmpty().withMessage('Unit is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('reorderThreshold').isInt({ min: 0 }).withMessage('Reorder threshold must be a non-negative integer'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  ],
  productController.createProduct,
);

router.put(
  '/:id',
  authorize(['admin', 'inventory_manager']),
  [
    param('id').isMongoId().withMessage('Valid product id is required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('reorderThreshold').optional().isInt({ min: 0 }).withMessage('Reorder threshold must be a non-negative integer'),
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  ],
  productController.updateProduct,
);

router.delete('/:id', authorize(['admin', 'inventory_manager']), [param('id').isMongoId().withMessage('Valid product id is required')], productController.removeProduct);

module.exports = router;
