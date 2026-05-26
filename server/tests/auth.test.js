const request = require('supertest');
const app = require('../src/app');

describe('Protected routes without token', () => {
  it('GET /api/students returns 401 without auth', async () => {
    const res = await request(app).get('/api/students');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/analytics returns 401 without auth', async () => {
    const res = await request(app).get('/api/analytics/students/000000000000000000000000/terms');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/chat returns 401 without auth', async () => {
    const res = await request(app).get('/api/chat/children');
    expect([401, 403]).toContain(res.status);
  });
});
