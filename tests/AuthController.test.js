import { expect } from 'chai';
import request from 'request';

describe('authController', () => {
  describe('getConnect', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 401 if no auth', async () => {
      const response = await new Promise((resolve, reject) => {
        // eslint-disable-next-line no-unused-vars
        request('http://localhost:5000/connect', (error, response, body) => {
          if (error) reject(error);
          else resolve(response);
        });
      });

      // eslint-disable-next-line jest/valid-expect
      expect(response.statusCode).to.equal(401);
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 200 and send a token', async () => {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            url: 'http://localhost:5000/connect',
            headers: {
              Authorization: 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=',
            },
          },
          // eslint-disable-next-line no-unused-vars
          (error, response, body) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });

      const body = JSON.parse(response.body);
      // eslint-disable-next-line jest/valid-expect
      expect(response.statusCode).to.equal(200);
      // eslint-disable-next-line jest/valid-expect
      expect(body).to.have.property('token');
    });
  });

  describe('getDisconnect', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 401 if no token', async () => {
      const response = await new Promise((resolve, reject) => {
        // eslint-disable-next-line no-unused-vars
        request('http://localhost:5000/disconnect', (error, response, body) => {
          if (error) reject(error);
          else resolve(response);
        });
      });

      // eslint-disable-next-line jest/valid-expect
      expect(response.statusCode).to.equal(401);
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return 401 if token is not a string', async () => {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            url: 'http://localhost:5000/disconnect',
            headers: { 'X-Token': 123 },
          },
          // eslint-disable-next-line no-unused-vars
          (error, response, body) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });

      // eslint-disable-next-line jest/valid-expect
      expect(response.statusCode).to.equal(401);
    });
  });
});
