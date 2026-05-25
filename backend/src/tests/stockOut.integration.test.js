const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

const adminUser = {
  name: 'Integration Admin',
  email: 'integration-admin@acdi.test',
  password: 'Integration123',
  role: 'admin',
};

const inventoryPayload = {
  name: 'Office Laptop',
  category: 'Electronics',
  unit: 'pcs',
  vendor: 'ACDI Supplies',
  supplier: 'ACDI Supplier',
  receivedBy: 'warehouse.team',
  notes: 'Initial inventory batch',
  quantity: 20,
  reorderThreshold: 5,
  unitPrice: 850.5,
};

async function getAuthToken() {
  await request(app).post('/api/v1/auth/register').send(adminUser);
  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });

  return loginResponse.body.data.token;
}

describe('CIT003 - Stock Out Integration', () => {
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

  test('should decrease product quantity via stock-out API', async () => {
    const token = await getAuthToken();

    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(inventoryPayload);

    const productId = productResponse.body.data._id;

    const stockOutResponse = await request(app)
      .post('/api/v1/stock/stock-out')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 6,
        note: 'Customer order fulfillment',
      });

    expect(stockOutResponse.statusCode).toBe(200);
    expect(stockOutResponse.body.success).toBe(true);
    expect(stockOutResponse.body.data.product.quantity).toBe(14);
    expect(stockOutResponse.body.data.transaction).toMatchObject({
      type: 'stock-out',
      quantity: 6,
      note: 'Customer order fulfillment',
    });
  });

  test('should fail stock-out when quantity exceeds available inventory', async () => {
    const token = await getAuthToken();

    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(inventoryPayload);

    const productId = productResponse.body.data._id;

    const stockOutResponse = await request(app)
      .post('/api/v1/stock/stock-out')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 100,
        note: 'Attempt to remove too many items',
      });

    expect(stockOutResponse.statusCode).toBe(400);
    expect(stockOutResponse.body.success).toBe(false);
    expect(stockOutResponse.body.message).toBe('Insufficient product quantity');
  });
});
