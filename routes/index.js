// eslint-disable-next-line no-unused-vars
import express from 'express';
import AppController from '../controllers/AppController';
import { APIError, errorResponse } from '../middlewares/error';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import AuthController from '../controllers/AuthController';

/**
 * Injects routes with their handlers
 * @param {express} api
 */
const injectRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);
  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);
  api.get('/users/me', UsersController.getMe);
  api.get('/files', FilesController.getIndex);
  api.get('/files/:id', FilesController.getShow);
  api.get('/files/:id/data', FilesController.getFile);
  api.post('/users', UsersController.postNew);
  api.post('/files', FilesController.postUpload);
  api.put('/files/:id/publish', FilesController.putPublish);
  api.put('/files/:id/unpublish', FilesController.putUnpublish);

  api.all('*', (req, res, next) => {
    errorResponse(
      new APIError(404, `Cannot ${req.method} ${req.url}`),
      req,
      res,
      next,
    );
  });
  api.use(errorResponse);
  api.use(express.json());
};

export default injectRoutes;
