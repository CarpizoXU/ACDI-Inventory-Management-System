const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

const testUser = {
  name: 'Test Admin',
  email: 'admin@acdi.local',
  password: 'Password123',
  role: 'admin',
};

describe('Authentication API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/acdi_inventory_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should register a user and return created response', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('email', testUser.email);
  });

  test('should login an existing user', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
  });
});
