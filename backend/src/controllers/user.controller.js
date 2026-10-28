import { authService } from '../services/auth.service.js';
import { HttpError } from '../utils/http-error.js';
export function userController(users, secret) {
  const auth = authService(users, secret);
  return {
    register: async (req, res) => res.status(201).json({ user: await auth.register(req.body) }),
    login: async (req, res) => res.json(await auth.login(req.body)),
    profile: async (req, res) => {
      if (!/^[1-9]\d*$/.test(req.params.id)) throw new HttpError(400, 'Invalid user ID');
      if (req.params.id !== req.userId) throw new HttpError(403, 'You can only access your own profile');
      const user = await users.byId(req.params.id);
      if (!user) throw new HttpError(404, 'User not found');
      res.json({ user });
    },
  };
}
