import { Router } from 'express';
import { registerUser, loginUser, googleAuth, updateUser, getUserProfile } from '../controllers/user/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUser);

export default router;
