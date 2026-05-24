const express = require('express');
const { body } = require('express-validator');
const physicalCountController = require('../controllers/physicalCountController');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const createCountValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required for each item'),
  body('items.*.countedQuantity')
    .isInt({ min: 0 })
    .withMessage('Counted quantity must be a non-negative integer'),
  body('items.*.notes').optional().isString(),
  body('location').optional().isString(),
  body('notes').optional().isString(),
];

const countIdValidation = [
  (req, res, next) => {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid count ID' });
    }
    next();
  },
];

router.post(
  '/create',
  authorize(['admin', 'inventory_manager']),
  createCountValidation,
  physicalCountController.createCount
);

router.get('/list', authorize(['admin', 'inventory_manager', 'staff']), physicalCountController.listCounts);

router.get(
  '/:id',
  countIdValidation,
  authorize(['admin', 'inventory_manager', 'staff']),
  physicalCountController.getCount
);

router.post(
  '/:id/submit',
  countIdValidation,
  authorize(['admin', 'inventory_manager']),
  physicalCountController.submitCount
);

router.post(
  '/:id/reconcile',
  countIdValidation,
  authorize(['admin', 'inventory_manager']),
  physicalCountController.reconcileCount
);

module.exports = router;
