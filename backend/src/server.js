import { config } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './config/db.js';
import { users } from './repositories/user.repository.js';
const app = createApp({ users, secret: process.env.JWT_SECRET, health: () => pool.query('SELECT 1') });
const server = app.listen(config.port, '0.0.0.0', () => console.log(`API listening on port ${config.port}`));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(async () => { await pool.end(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
