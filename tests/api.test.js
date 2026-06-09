const request = require('supertest');
const { app } = require('../src/index');

describe('API Tests', () => {
  describe('Auth Endpoints', () => {
    test('POST /api/auth/verify-pin - should verify valid PIN', async () => {
      const response = await request(app)
        .post('/api/auth/verify-pin')
        .send({ pin: '123456' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });
    
    test('POST /api/auth/verify-pin - should reject invalid PIN', async () => {
      const response = await request(app)
        .post('/api/auth/verify-pin')
        .send({ pin: '000000' });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('Health Check', () => {
    test('GET /api/health - should return OK', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
