import { Router } from 'express';
import authenticationController from '../controllers/authentication.controller.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey';

router.post('/register', async (req, res) => {
    try {
        await authenticationController.register(req, res);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to register user', error });
    }
});

router.post('/login', async (req, res) => {
    try {
        await authenticationController.login(req, res);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to login user', error });
    }
});

router.post('/verify-token', authenticationController.verifyToken);

router.post('/logout', async (req, res) => {
    try {
        await authenticationController.logout(req, res);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to logout user', error });
    }
});

export default router;