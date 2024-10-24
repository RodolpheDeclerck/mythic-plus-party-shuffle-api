import { Router } from 'express';
import authenticationController from '../controllers/authentication.controller.js';

const router = Router();

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

export default router;