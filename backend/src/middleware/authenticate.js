import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http-error.js';
export function authenticate(secret) {
  return (req, res, next) => {
    try {
      const header = req.get('authorization') || '';
      if (!header.startsWith('Bearer ')) throw new Error();
      const payload = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'], issuer: 'nagaed-api', audience: 'nagaed-web' });
      if (!/^[1-9]\d*$/.test(payload.sub)) throw new Error();
      req.userId = payload.sub;
      next();
    } catch { next(new HttpError(401, 'A valid access token is required')); }
  };
}
