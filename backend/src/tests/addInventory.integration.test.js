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

describe('CIT001 - Add Inventory Integration', () => {
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

  test('should create a new product through add inventory API', async () => {
    const token = await getAuthToken();

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(inventoryPayload);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).toMatchObject({
      name: inventoryPayload.name,
      category: inventoryPayload.category,
      unit: inventoryPayload.unit,
      quantity: inventoryPayload.quantity,
      reorderThreshold: inventoryPayload.reorderThreshold,
      unitPrice: inventoryPayload.unitPrice,
    });
    expect(response.body.data.stockStatus).toBe('ok');
  });
});
