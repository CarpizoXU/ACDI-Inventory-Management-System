const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

const testUser = {
  name: 'Test Admin',
  email: 'admin@acdi.local',
  password: 'Password123',
  role: 'admin',
};

let mongoServer;

describe('Authentication API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
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
  
  test('should return authenticated user profile', async () => {

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password,
    });

  const token = loginResponse.body.data.token;

  const response = await request(app)
    .get('/api/v1/auth/profile')
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.user.email).toBe(testUser.email);
  });
});


