import { Router } from 'express';
import { authControllers } from '../controllers';
import { requireAuth, validate, authLimiter } from '../../middleware';
import { registerSchema, loginSchema, refreshSchema } from '../../validators';

const router = Router();

/**
 * /api/auth
 * Public: register, login, refresh. Private: me, logout.
 */
router.post('/register', authLimiter, validate({ body: registerSchema }), authControllers.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authControllers.login);
router.post('/refresh', validate({ body: refreshSchema }), authControllers.refresh);
router.get('/me', requireAuth, authControllers.me);
router.post('/logout', requireAuth, authControllers.logout);

export default router;
