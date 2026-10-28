import { rateLimit } from 'express-rate-limit';
// shortcut: per-process limits, use Redis-backed limits when deploying multiple replicas.
export function limiter(limit, windowMs = 15 * 60 * 1000, skipSuccessfulRequests = false) {
  return rateLimit({ windowMs, limit, skipSuccessfulRequests, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: { message: 'Too many requests; try again later' } }),
  });
}
