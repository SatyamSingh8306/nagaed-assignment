import { errorHandler } from './middleware/error-handler.js';
import express from 'express';
import helmet from 'helmet';
import { limiter } from './middleware/rate-limit.js';
import { routes } from './routes/user.routes.js';
export function createApp({ users, secret, health = async () => {} }) {
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', async (req, res) => { await health(); res.json({ status: 'ok' }); });
  app.use('/api', limiter(100));
  app.use('/api', routes(users, secret));
  app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
  app.use(errorHandler);
  return app;
}
