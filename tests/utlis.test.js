/* eslint-disable import/no-named-as-default */
import { expect } from 'chai';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

describe('redisClient', () => {
  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return true', () => {
    // eslint-disable-next-line jest/valid-expect
    expect(redisClient.isAlive()).to.equal(true);
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should be able to set and get values from Redis server', async () => {
    const key = 'key';
    const value = 'value';
    await redisClient.set(key, value, 5);
    const result = await redisClient.get(key);
    // eslint-disable-next-line jest/valid-expect
    expect(result).to.equal(value);
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return null for a non-existing key', async () => {
    const result = await redisClient.get('nonexisting');
    // eslint-disable-next-line no-unused-expressions, jest/valid-expect
    expect(result).to.be.null;
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should be able to delete a key', async () => {
    const key = 'key';
    const value = 'value';
    await redisClient.set(key, value, 5);
    await redisClient.del(key);
    const result = await redisClient.get(key);
    // eslint-disable-next-line no-unused-expressions, jest/valid-expect
    expect(result).to.be.null;
  });
});

describe('dbClient', () => {
  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return true', () => {
    // eslint-disable-next-line jest/valid-expect
    expect(dbClient.isAlive()).to.equal(true);
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return 1 for users and 3 for files', async () => {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    // eslint-disable-next-line jest/valid-expect
    expect(usersCount).to.equal(1);
    // eslint-disable-next-line jest/valid-expect
    expect(filesCount).to.equal(3);
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return a users collection', async () => {
    const usersCollection = await dbClient.usersCollection();
    // eslint-disable-next-line jest/valid-expect
    expect(usersCollection).to.be.an('object');
  });

  // eslint-disable-next-line jest/prefer-expect-assertions
  it('should return a files collection', async () => {
    const filesCollection = await dbClient.filesCollection();
    // eslint-disable-next-line jest/valid-expect
    expect(filesCollection).to.be.an('object');
  });
});
