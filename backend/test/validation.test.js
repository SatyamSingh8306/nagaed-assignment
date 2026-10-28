import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/middleware/validate.js';

const account = { username: 'Student_1', email: ' Student@example.com ', password: 'eight-or-more', address: ' Kohima ' };
test('normalize email and address, preserve password', () => {
  const result = validate(account, true);
  assert.equal(result.email, 'student@example.com');
  assert.equal(result.address, 'Kohima');
  assert.equal(result.password, account.password);
});
test('bcrypt UTF-8 limit and required fields', () => {
  assert.doesNotThrow(() => validate({ ...account, password: 'a'.repeat(72) }, true));
  for (const body of [null, [], {}, { ...account, password: 'a'.repeat(73) }, { ...account, password: '\u{1F600}'.repeat(19) }, { ...account, username: 'bad name' }, { ...account, address: 123 }, { ...account, email: 'bad' }]) {
    assert.throws(() => validate(body, true), error => error.status === 400);
  }
});
test('login ignores unused registration-only fields safely', () => {
  assert.doesNotThrow(() => validate({ ...account, address: 123 }));
});
