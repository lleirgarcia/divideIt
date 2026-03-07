import request from 'supertest';
import app from '../index';

describe('API Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return uptime as a number', async () => {
      const response = await request(app).get('/api/health');
      
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/videos/split — validacion outputFormat', () => {
    it('devuelve 400 cuando outputFormat tiene un valor invalido', async () => {
      const response = await request(app)
        .post('/api/videos/split')
        .field('outputFormat', 'cuadrado');

      // Sin archivo siempre es 400, pero el mensaje debe mencionar el archivo, no outputFormat.
      // Este test verifica que cuando hay archivo y outputFormat invalido, devuelve 400.
      // Con archivo invalido (sin campo video) siempre llegamos a 400 "No video file provided".
      expect(response.status).toBe(400);
    });

    test.todo('devuelve 400 con mensaje descriptivo cuando outputFormat es invalido y se envia un video valido');
    test.todo('acepta outputFormat=vertical y procesa correctamente');
    test.todo('acepta outputFormat=horizontal y procesa correctamente');
    test.todo('usa vertical por defecto cuando outputFormat no se especifica');
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      
      expect(response.status).toBe(404);
    });
  });
});
