const { validationResult } = require('express-validator');
const productService = require('../services/productService');
const apiResponse = require('../utils/apiResponse');

async function createProduct(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const product = await productService.createProduct({
      ...req.body,
      createdBy: req.user?.email || 'system',
    });

    return apiResponse.created(res, product);
  } catch (err) {
    return next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      stockStatus: req.query.stockStatus,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    };
    const result = await productService.listProducts(filters);
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const product = await productService.getProductById(req.params.id);
    return apiResponse.success(res, product);
  } catch (err) {
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const product = await productService.updateProduct(req.params.id, {
      ...req.body,
      updatedBy: req.user?.email || 'system',
    });

    return apiResponse.success(res, product);
  } catch (err) {
    return next(err);
  }
}

async function removeProduct(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const product = await productService.archiveProduct(req.params.id);
    return apiResponse.success(res, product, 'Product archived successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  removeProduct,
};
