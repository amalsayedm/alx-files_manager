/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(req, res) {
    const auth = req.header.authorization;
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const creds = {
      email: buff.toString('utf-8').split(':')[0],
      password: buff.toString('utf-8').split(':')[1],
    };
    const user = await dbClient.usersCollection.findOne({
      email: creds.email,
      password: sha1(creds.password),
    });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    redisClient.del(key);
    res.status(204).end();
  }
}
