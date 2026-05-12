const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const productRepository = require('../repositories/productRepository');
const stockService = require('../services/stockService');

let mongoServer;

const baseProduct = {
  name: 'Test Product',
  category: 'Office Supplies',
  unit: 'pcs',
  supplier: 'Acme Supplies',
  receivedBy: 'staff.user',
  dateReceived: new Date('2026-05-12'),
  notes: 'Initial stock',
  quantity: 10,
  reorderThreshold: 5,
};

describe('Stock Transactions', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('should record stock-in and increase product quantity', async () => {
    const product = await productRepository.createProduct(baseProduct);
    const result = await stockService.recordStockIn({
      productId: product._id,
      quantity: 5,
      performedBy: 'staff.user',
      note: 'Received new shipment',
    });

    expect(result.product.quantity).toBe(15);
    expect(result.transaction.type).toBe('stock-in');
    expect(result.transaction.quantity).toBe(5);
    expect(result.transaction.performedBy).toBe('staff.user');
  });

  test('should record stock-out and decrease product quantity', async () => {
    const product = await productRepository.createProduct(baseProduct);
    const result = await stockService.recordStockOut({
      productId: product._id,
      quantity: 4,
      performedBy: 'staff.user',
      note: 'Dispatched goods',
    });

    expect(result.product.quantity).toBe(6);
    expect(result.transaction.type).toBe('stock-out');
    expect(result.transaction.quantity).toBe(4);
  });

  test('should reject stock-out when quantity is insufficient', async () => {
    const product = await productRepository.createProduct(baseProduct);

    await expect(
      stockService.recordStockOut({
        productId: product._id,
        quantity: 20,
        performedBy: 'staff.user',
        note: 'Invalid dispatch',
      }),
    ).rejects.toMatchObject({ statusCode: 400, message: 'Insufficient product quantity' });
  });

  test('API should accept stock-in request and respond with success', async () => {
    const product = await productRepository.createProduct(baseProduct);

    const response = await request(app)
      .post('/api/v1/stock/stock-in')
      .send({
        productId: product._id,
        quantity: 2,
        performedBy: 'staff.user',
        note: 'Test stock-in',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.transaction.type).toBe('stock-in');
  });

  test('API should reject invalid stock-out request', async () => {
    const product = await productRepository.createProduct(baseProduct);

    const response = await request(app)
      .post('/api/v1/stock/stock-out')
      .send({
        productId: product._id,
        quantity: 0,
        performedBy: 'staff.user',
        note: 'Invalid request',
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.success).toBe(false);
  });
});
