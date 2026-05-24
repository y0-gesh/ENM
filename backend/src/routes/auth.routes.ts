import { Router } from 'express';
import { register, login, refresh, logout, registerSchema, loginSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticateJWT, logout);

export default router;
