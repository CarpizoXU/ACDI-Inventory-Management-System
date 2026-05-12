const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password is required'),
  ],
  authController.login,
);

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'inventory_manager', 'staff', 'auditor']).withMessage('Invalid role'),
  ],
  authController.register,
);

router.get('/profile', authorize(), authController.profile);

module.exports = router;
