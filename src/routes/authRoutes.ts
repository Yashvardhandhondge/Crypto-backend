import express from 'express';
import { AuthController } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', auth, AuthController.getProfile);
router.patch('/profile', auth, AuthController.updateProfile);
// router.post('/wallet/connect', auth, AuthController.connectWallet);

export default router;