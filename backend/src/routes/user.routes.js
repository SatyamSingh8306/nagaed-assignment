import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { limiter } from '../middleware/rate-limit.js';
import { userController } from '../controllers/user.controller.js';
export function routes(users, secret) {
  const router = Router();
  const controller = userController(users, secret);
  router.post('/register', limiter(10, 60 * 60 * 1000), controller.register);
  router.post('/login', limiter(10, 15 * 60 * 1000, true), controller.login);
  router.get('/users/:id', authenticate(secret), controller.profile);
  return router;
}
