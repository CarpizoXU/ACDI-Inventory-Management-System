const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

const adminUser = {
  name: 'Inventory Admin',
  email: 'inventory-admin@acdi.test',
  password: 'Inventory123',
  role: 'admin',
};

const baseProduct = {
  name: 'Stapler',
  category: 'Office',
  unit: 'pcs',
  vendor: 'ACDI Supplies',
  supplier: 'ACDI Supplier',
  receivedBy: 'warehouse.team',
  notes: 'Initial stock',
  quantity: 20,
  reorderThreshold: 5,
  unitPrice: 150,
};

async function getAuthToken() {
  await request(app).post('/api/v1/auth/register').send(adminUser);
  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    email: adminUser.email,
    password: adminUser.password,
  });

  return loginResponse.body.data.token;
}

describe('inventory and physical count validation', () => {
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

  test('should reject duplicate product names with a clear error', async () => {
    const token = await getAuthToken();

    const firstResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(baseProduct);

    expect(firstResponse.statusCode).toBe(201);

    const duplicateResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...baseProduct,
        quantity: 8,
      });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.message).toContain('already exists');
  });

  test('should create a physical count and return populated item data', async () => {
    const token = await getAuthToken();

    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send(baseProduct);

    const productId = productResponse.body.data._id;

    const response = await request(app)
      .post('/api/v1/physical-counts/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Main Warehouse',
        items: [{ product: productId, countedQuantity: 18, notes: 'Shelf count' }],
        notes: 'Monthly count',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.referenceNumber).toBeTruthy();
    expect(response.body.data.items[0].product).toHaveProperty('name', baseProduct.name);
    expect(response.body.data.items[0].countedQuantity).toBe(18);
  });
});
