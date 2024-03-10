/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-vars */
import fs from 'fs';
import { tmpdir } from 'os';
import mime from 'mime-types';
import { promisify } from 'util';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
// import { mkdir, writeFile, readFile, fs } from 'fs';
import { join as joinPath } from 'path';
import { Request, Response } from 'express';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import UsersController from './UsersController';

const VALID_FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const ROOT_FOLDER_ID = 0;
const DEFAULT_ROOT_FOLDER = 'files_manager';
const mkDirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const isValidId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [48, 57], // 0 - 9
    [97, 102], // a - f
    [65, 70], // A - F
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);

    if (!charRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
  }
  return true;
};

export default class FilesController {
  /**
   * Uploads a file.
   * @param {Request} req The Express request object.
   * @param {Response} res The Express response object.
   */
  static async postUpload(req, res) {
    const user = await UsersController.getuser(req, res);
    if (!user) {
      return;
    }
    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    let parentId;
    if (req.body && req.body.parentId) {
      parentId = req.body.parentId;
    } else {
      parentId = ROOT_FOLDER_ID;
    }
    const isPublic = req.body && req.body.isPublic ? req.body.isPublic : false;
    const base64Data = req.body && req.body.data ? req.body.data : '';

    if (!name) {
      res.status(400).send({ error: 'Missing name' });
      return;
    }
    if (!type || !Object.values(VALID_FILE_TYPES).includes(type)) {
      res.status(400).send({ error: 'Missing type' });
      return;
    }
    if (!req.body.data && type !== VALID_FILE_TYPES.folder) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    if (parentId !== ROOT_FOLDER_ID && parentId !== ROOT_FOLDER_ID.toString()) {
      const file = await (
        await dbClient.filesCollection()
      ).findOne({
        _id: new mongoDBCore.BSON.ObjectId(
          isValidId(parentId) ? parentId : NULL_ID,
        ),
      });

      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== VALID_FILE_TYPES.folder) {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }
    const userId = user._id.toString();
    let baseDir;
    if (`${process.env.FOLDER_PATH || ''}`.trim().length > 0) {
      baseDir = process.env.FOLDER_PATH.trim();
    } else {
      baseDir = joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);
    }
    const newFile = {
      userId: new mongoDBCore.BSON.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId:
        parentId === ROOT_FOLDER_ID || parentId === ROOT_FOLDER_ID.toString()
          ? '0'
          : new mongoDBCore.BSON.ObjectId(parentId),
    };
    await mkDirAsync(baseDir, { recursive: true });
    /**
     * if it is not a folder
     * */
    if (type !== VALID_FILE_TYPES.folder) {
      const localPath = joinPath(baseDir, uuidv4());
      await writeFileAsync(localPath, Buffer.from(base64Data, 'base64'));
      newFile.localPath = localPath;
    }
    const insertionInfo = await (
      await dbClient.filesCollection()
    ).insertOne(newFile);

    const fileId = insertionInfo.insertedId.toString();
    res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId:
        parentId === ROOT_FOLDER_ID || parentId === ROOT_FOLDER_ID.toString()
          ? 0
          : parentId,
    });
  }

  static async getShow(req, res) {
    const user = await UsersController.getuser(req, res);
    if (!user) {
      return;
    }

    const userId = user._id.toString();
    const fileId = req.params.id;
    if (!isValidId(fileId) || !fileId || !isValidId(userId) || !userId) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const file = await (
      await dbClient.filesCollection()
    ).findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const user = await UsersController.getuser(req, res);
    if (!user) {
      return;
    }
    const parentId = req.query.parentId || ROOT_FOLDER_ID.toString();
    const page = Number(req.query.page) || 0;
    const pageSize = 20;
    const skip = page * pageSize;
    const userId = ObjectId(user._id);
    const filesCollection = await dbClient.filesCollection();
    const match = {
      userId,
      parentId,
    };
    const pipeline = [
      {
        $match: match,
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ];
    const files = await filesCollection.aggregate(pipeline).toArray();
    const newFiles = files.map((file) => {
      const { _id, ...rest } = file;
      return { id: _id, ...rest };
    });
    res.status(200).json(newFiles);
  }

  static async putPublish(req, res) {
    const user = await UsersController.getuser(req, res);
    if (!user) {
      return;
    }
    const userId = user._id.toString();
    const fileId = req.params.id;
    const file = await (
      await dbClient.filesCollection()
    ).findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await (
      await dbClient.filesCollection()
    ).updateOne(
      { _id: ObjectId(fileId), userId: ObjectId(userId) },
      { $set: { isPublic: true } },
    );
    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const user = await UsersController.getuser(req, res);
    if (!user) {
      return;
    }
    const userId = user._id.toString();
    const fileId = req.params.id;
    const file = await (
      await dbClient.filesCollection()
    ).findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await (
      await dbClient.filesCollection()
    ).updateOne(
      { _id: ObjectId(fileId), userId: ObjectId(userId) },
      { $set: { isPublic: false } },
    );
    res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    const fileId = req.params.id;
    const file = await (
      await dbClient.filesCollection()
    ).findOne({ _id: ObjectId(fileId) });
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const data = await readFileAsync(file.localPath, 'utf-8');

    const mimeType = mime.lookup(file.name);
    if (!mimeType) {
      return res.status(404).send({ error: 'Not found' });
    }

    res.setHeader('Content-Type', mimeType);
    return res.status(200).send(data);
  }
}
