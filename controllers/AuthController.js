/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (!auth.startsWith('Basic ')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const creds = {
      email: buff.toString('utf-8').split(':')[0],
      password: buff.toString('utf-8').split(':')[1],
    };
    if (!creds.email || !creds.password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (typeof creds.email !== 'string' || typeof creds.password !== 'string') {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (creds.email.length === 0 || creds.password.length === 0) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (creds.email === creds.password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await (
      await dbClient.usersCollection()
    ).findOne({
      email: creds.email,
      password: sha1(creds.password),
    });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 3600);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (typeof token !== 'string') {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    await redisClient.del(key);
    return res.status(204).end();
  }
}
