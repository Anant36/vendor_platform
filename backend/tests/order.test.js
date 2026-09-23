require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
require('./setup');
const request = require('supertest');
const app = require('../server');
const Product = require('../models/Product');

async function registerAndLogin() {
  const payload = {
    name: 'Vendor One',
    email: 'vendor1@test.com',
    password: 'password123',
    role: 'vendor',
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body.token, userId: res.body.user._id };
}

describe('Order creation and stock automation', () => {
  it('creates an order and deducts stock accordingly', async () => {
    const { token, userId } = await registerAndLogin();

    const product = await Product.create({
      name: 'Plywood Sheet 8x4',
      sku: 'PLY-8X4',
      price: 1200,
      stock: 50,
      lowStockThreshold: 10,
      vendor: userId,
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product._id, quantity: 5 }] });

    expect(res.statusCode).toBe(201);
    expect(res.body.totalAmount).toBe(6000);

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(45);
  });

  it('rejects an order when requested quantity exceeds available stock', async () => {
    const { token, userId } = await registerAndLogin();

    const product = await Product.create({
      name: 'MDF Board',
      sku: 'MDF-01',
      price: 800,
      stock: 3,
      vendor: userId,
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product._id, quantity: 10 }] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/);

    const unchanged = await Product.findById(product._id);
    expect(unchanged.stock).toBe(3);
  });

  it('flags a product as low stock once it crosses the threshold after an order', async () => {
    const { token, userId } = await registerAndLogin();

    const product = await Product.create({
      name: 'Laminate Sheet',
      sku: 'LAM-01',
      price: 500,
      stock: 12,
      lowStockThreshold: 10,
      vendor: userId,
    });

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product._id, quantity: 5 }] });

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(7);
    expect(updated.isLowStock()).toBe(true);
  });
});
