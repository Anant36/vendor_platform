require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
require('./setup');
const request = require('supertest');
const app = require('../server');

describe('Auth flow', () => {
  const userPayload = {
    name: 'Test Vendor',
    email: 'vendor@test.com',
    password: 'password123',
    role: 'vendor',
    businessName: 'Test Traders',
  };

  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(userPayload.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: userPayload.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });
});
