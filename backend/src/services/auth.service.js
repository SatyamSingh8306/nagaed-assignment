import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http-error.js';
import { validate } from '../middleware/validate.js';
export function authService(users, secret) {
  return {
    async register(body) {
      const data = validate(body, true);
      try { return await users.create({ ...data, password: undefined, passwordHash: await bcrypt.hash(data.password, 12) }); }
      catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Email already in use'); throw error; }
    },
    async login(body) {
      const { email, password } = validate(body);
      const user = await users.byEmail(email);
      // Always compare a hash so unknown accounts follow the same expensive path.
      const valid = await bcrypt.compare(password, user?.password_hash || '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5E9ZBz7uWXxFh7sFSd9fOD4UQy9xC1K');
      if (!user || !valid) throw new HttpError(401, 'Invalid credentials');
      return { token: jwt.sign({}, secret, { subject: String(user.id), expiresIn: '1h', issuer: 'nagaed-api', audience: 'nagaed-web', algorithm: 'HS256' }), userId: user.id };
    },
  };
}
