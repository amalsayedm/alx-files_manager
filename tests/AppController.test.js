import { expect } from 'chai';
import sinon from 'sinon';
import AppController from '../controllers/AppController';
// eslint-disable-next-line import/no-named-as-default
import redisClient from '../utils/redis';
// eslint-disable-next-line import/no-named-as-default
import dbClient from '../utils/db';

const { stub } = sinon;

describe('appController', () => {
  describe('getStatus', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return the status of the server', () => {
      // Stub isAlive method of redisClient
      sinon.stub(redisClient, 'isAlive').returns(true);
      sinon.stub(dbClient, 'isAlive').returns(true);

      const req = {};
      const res = {
        status: stub().returnsThis(),
        json: stub().returnsThis(),
      };

      AppController.getStatus(req, res);

      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.status.calledWith(200)).to.be.true;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.json.calledWith({ redis: true, db: true })).to.be.true;

      // Restore the stubs
      sinon.restore();
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return false for redis', () => {
      // Stub isAlive method of redisClient to return false
      sinon.stub(redisClient, 'isAlive').returns(false);

      const req = {};
      const res = {
        status: stub().returnsThis(),
        json: stub().returnsThis(),
      };

      AppController.getStatus(req, res);

      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.status.calledWith(200)).to.be.true;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.json.calledWith({ redis: false, db: true })).to.be.true;

      // Restore the stub
      sinon.restore();
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return false for db', () => {
      // Stub isAlive method of dbClient to return false
      sinon.stub(dbClient, 'isAlive').returns(false);

      const req = {};
      const res = {
        status: stub().returnsThis(),
        json: stub().returnsThis(),
      };

      AppController.getStatus(req, res);

      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.status.calledWith(200)).to.be.true;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.json.calledWith({ redis: true, db: false })).to.be.true;

      // Restore the stub
      sinon.restore();
    });

    // eslint-disable-next-line jest/prefer-expect-assertions
    it('should return false for both redis and db', () => {
      // Stub isAlive method of redisClient and dbClient to return false
      sinon.stub(redisClient, 'isAlive').returns(false);
      sinon.stub(dbClient, 'isAlive').returns(false);

      const req = {};
      const res = {
        status: stub().returnsThis(),
        json: stub().returnsThis(),
      };

      AppController.getStatus(req, res);

      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.status.calledWith(200)).to.be.true;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.json.calledWith({ redis: false, db: false })).to.be.true;

      // Restore the stubs
      sinon.restore();
    });
  });

  describe('getStats', () => {
    // eslint-disable-next-line jest/prefer-expect-assertions, jest/expect-expect
    it('should return the number of users and files in the db', async () => {
      // Stub nbUsers and nbFiles methods of dbClient
      sinon.stub(dbClient, 'nbUsers').resolves(1);
      sinon.stub(dbClient, 'nbFiles').resolves(3);

      const req = {};
      const res = {
        status: stub().returnsThis(),
        json: stub().returnsThis(),
      };

      await await AppController.getStats(req, res);

      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.status.calledWith(200)).to.be.true;
      // eslint-disable-next-line no-unused-expressions, jest/valid-expect
      expect(res.json.calledWith({ users: 1, files: 3 })).to.be.true;

      // Restore the stubs
      sinon.restore();
    });
  });
});
