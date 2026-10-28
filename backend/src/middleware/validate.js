import { HttpError } from '../utils/http-error.js';
export function validate(body, registration = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'A JSON object is required');
  const { email, password, username, address } = body;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new HttpError(400, 'Enter a valid email address');
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new HttpError(400, 'Password must be at least 8 characters and at most 72 UTF-8 bytes');
  if (registration && (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,30}$/.test(username))) throw new HttpError(400, 'Username must contain 3-30 letters, numbers or underscores');
  if (registration && (typeof address !== 'string' || !address.trim() || address.trim().length > 500)) throw new HttpError(400, 'Address must contain 1-500 characters');
  return { email: email.trim().toLowerCase(), password, username, address: registration ? address.trim() : undefined };
}
