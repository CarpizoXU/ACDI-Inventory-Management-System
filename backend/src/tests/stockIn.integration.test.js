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

describe('CIT002 - Stock In Integration', () => {
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

  test('should increase product quantity via stock-in API', async () => {
    const token = await getAuthToken();

    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(inventoryPayload);

    const productId = productResponse.body.data._id;

    const stockInResponse = await request(app)
      .post('/api/v1/stock/stock-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 10,
        note: 'Stock replenishment',
      });

    expect(stockInResponse.statusCode).toBe(200);
    expect(stockInResponse.body.success).toBe(true);
    expect(stockInResponse.body.data.product.quantity).toBe(30);
    expect(stockInResponse.body.data.transaction).toMatchObject({
      type: 'stock-in',
      quantity: 10,
      note: 'Stock replenishment',
    });
  });
});
