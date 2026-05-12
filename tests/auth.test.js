const request = require('supertest');

jest.mock('../src/config/database', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  getPool: jest.fn(),
  query: jest.fn(),
}));

const mockUserModel = require('./__mocks__/userModel');
const mockTokenModel = require('./__mocks__/tokenModel');

jest.mock('../src/models/user.model', () => mockUserModel);
jest.mock('../src/models/token.model', () => mockTokenModel);

const app = require('../src/app');

let accessToken, refreshToken, adminAccessToken;
const testUser = { name: 'John Doe', email: 'john.doe@example.com', password: 'Password@123' };
const adminUser = { name: 'Admin User', email: 'admin@example.com', password: 'Admin@1234', role: 'admin' };

describe('GET /health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });
});

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.password_hash).toBeUndefined();
  });
  it('registers admin user', async () => {
    const res = await request(app).post('/api/auth/register').send(adminUser);
    expect(res.statusCode).toBe(201);
    adminAccessToken = res.body.data.tokens.accessToken;
  });
  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(409);
  });
  it('rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'x@test.com', password: '1234' });
    expect(res.statusCode).toBe(400);
  });
  it('rejects missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Test', password: 'Password@123' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });
  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'WrongPass@1' });
    expect(res.statusCode).toBe(401);
  });
  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Password@1' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer badtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues new tokens with valid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.statusCode).toBe(200);
    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });
  it('rejects invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad.token.here' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/users', () => {
  it('returns all users for admin', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminAccessToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });
  it('returns 403 for non-admin', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  it('logs out successfully', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(res.statusCode).toBe(200);
  });
  it('refresh token is invalidated after logout', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.statusCode).toBe(401);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});
