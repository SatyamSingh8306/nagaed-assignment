import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

const secret = 'test-secret-with-more-than-thirty-two-characters';
function fixture() {
  const rows = [];
  const users = {
    async create(data) {
      if (rows.some(u => u.email === data.email)) throw Object.assign(new Error(), { code: 'ER_DUP_ENTRY' });
      const row = { id: rows.length + 1, username: data.username, email: data.email, address: data.address, password_hash: data.passwordHash };
      rows.push(row); return this.byId(row.id);
    },
    async byEmail(email) { return rows.find(u => u.email === email); },
    async byId(id) { const row = rows.find(u => String(u.id) === String(id)); if (!row) return undefined; const { password_hash, ...safe } = row; return safe; },
  };
  return { app: createApp({ users, secret }), rows };
}
const account = { username: 'Learner_01', email: 'Learner@example.com', password: 'valid-test-password', address: 'Kohima' };

test('register, duplicate, login, protected profile and cross-user access', async () => {
  const { app, rows } = fixture();
  const registered = await request(app).post('/api/register').send(account).expect(201);
  assert.equal(registered.body.user.email, 'learner@example.com');
  assert.equal(registered.body.user.password_hash, undefined);
  assert.match(rows[0].password_hash, /^\$2[aby]\$/);
  assert.notEqual(rows[0].password_hash, account.password);
  await request(app).post('/api/register').send(account).expect(409);
  await request(app).post('/api/login').send({ email: account.email, password: 'wrong-password' }).expect(401);
  const login = await request(app).post('/api/login').send(account).expect(200);
  const token = login.body.token;
  await request(app).get('/api/users/1').expect(401);
  const profile = await request(app).get('/api/users/1').auth(token, { type: 'bearer' }).expect(200);
  assert.equal(profile.body.user.username, account.username);
  assert.equal(profile.body.user.password_hash, undefined);
  await request(app).get('/api/users/2').auth(token, { type: 'bearer' }).expect(403);
  await request(app).get('/api/users/1').auth(token + 'broken', { type: 'bearer' }).expect(401);
  const expired = jwt.sign({}, secret, { subject: '1', expiresIn: -1, issuer: 'nagaed-api', audience: 'nagaed-web' });
  await request(app).get('/api/users/1').auth(expired, { type: 'bearer' }).expect(401);
});
test('reject malformed fields, JSON and oversized bcrypt input', async () => {
  const { app } = fixture();
  for (const body of [{}, { ...account, email: 'bad' }, { ...account, username: '../bad' }, { ...account, password: 'x' }, { ...account, password: '\u{1F600}'.repeat(19) }, { ...account, address: ' ' }]) {
    await request(app).post('/api/register').send(body).expect(400);
  }
  const result = await request(app).post('/api/login').set('Content-Type', 'application/json').send('{').expect(400);
  assert.equal(result.body.error.message, 'Malformed JSON body');
});
test('database failure returns a safe error', async () => {
  const app = createApp({ users: { byEmail() { throw new Error('database secret'); } }, secret });
  const result = await request(app).post('/api/login').send(account).expect(500);
  assert.equal(result.body.error.message, 'Service unavailable; please try again');
});

test('login rate limit returns JSON 429 after ten failures', async () => {
  const { app } = fixture();
  // Malformed requests count too, without spending time hashing ten passwords.
  for (let i = 0; i < 10; i++) await request(app).post('/api/login').send({}).expect(400);
  const result = await request(app).post('/api/login').send({}).expect(429);
  assert.equal(result.body.error.message, 'Too many requests; try again later');
});
