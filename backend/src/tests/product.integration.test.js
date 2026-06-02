// backend/src/tests/product.integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app'); 

// 👇 Give the mock database plenty of time to start up! 👇
jest.setTimeout(30000);

describe('Product Service Integration Tests', () => {
  let mongoServer;
  let adminToken;
  let createdProductId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const testAdmin = {
      name: 'Milestone 2 Admin',
      email: 'm2.admin@acdi.com',
      password: 'Password123!',
      role: 'admin' 
    };

    await request(app).post('/api/v1/auth/register').send(testAdmin);

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: testAdmin.email,
      password: testAdmin.password
    });

    adminToken = `Bearer ${loginResponse.body.data.token}`;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test Case 1: Create Product
  test('POST /api/v1/products - Should successfully create a product', async () => {
    const productPayload = {
      sku: 'SKU-M2-TEST-01', 
      name: 'Milestone 2 Integration Item',
      category: 'General',
      unit: 'pcs',
      quantity: 100,
      reorderThreshold: 15,
      unitPrice: 10.50 
    };

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', adminToken)
      .send(productPayload);

    if (response.statusCode === 422) {
      console.log('🚨 VALIDATION ERRORS:', JSON.stringify(response.body.errors, null, 2));
    }

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    
    createdProductId = response.body.data._id;
  });

  // Test Case 2: List Products
  test('GET /api/v1/products - Should retrieve a list of all products', async () => {
    const response = await request(app)
      .get('/api/v1/products')
      .set('Authorization', adminToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Check that 'data' has a 'products' array instead of being the array itself!
    expect(response.body.data).toHaveProperty('products');
    expect(Array.isArray(response.body.data.products)).toBe(true);
    expect(response.body.data.products.length).toBeGreaterThan(0);
    
    // Bonus: Check that your team's pagination fields are working
    expect(response.body.data).toHaveProperty('total');
    expect(response.body.data).toHaveProperty('page');
  });

  // Test Case 3: Update Product
  test('PUT /api/v1/products/:id - Should update existing product properties', async () => {
    const updatePayload = {
      name: 'Milestone 2 Item (Updated)',
      quantity: 120
    };

    const response = await request(app)
      .put(`/api/v1/products/${createdProductId}`)
      .set('Authorization', adminToken)
      .send(updatePayload);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Test Case 4: Get Single Product by ID
  test('GET /api/v1/products/:id - Should retrieve a single product by ID', async () => {
    const response = await request(app)
      .get(`/api/v1/products/${createdProductId}`)
      .set('Authorization', adminToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    // Ensure it fetched the exact same product we created earlier
    expect(response.body.data).toHaveProperty('_id', createdProductId); 
  });

  // Test Case 5: Delete Product
  test('DELETE /api/v1/products/:id - Should delete/archive a product', async () => {
    const response = await request(app)
      .delete(`/api/v1/products/${createdProductId}`)
      .set('Authorization', adminToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    // Optional Verification: Try to fetch it again, it should fail (404 Not Found)
    const fetchResponse = await request(app)
      .get(`/api/v1/products/${createdProductId}`)
      .set('Authorization', adminToken);
      
    expect(fetchResponse.statusCode).toBe(404);
  });

}); 