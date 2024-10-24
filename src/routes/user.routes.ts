import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { isAuthenticated, isOwner } from '../middlewares/authenticateJWT.js';

const router = Router();

// Route pour obtenir tous les utilisateurs
router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const users = await userController.getAllUsers(req, res);
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
});

// Route pour supprimer un utilisateur par ID
router.delete('/users/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const deletedUser = await userController.deleteUser(req, res);
        res.status(200).json(deletedUser);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete user', error });
    }
});

// Route pour mettre à jour un utilisateur par ID
router.patch('/users/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const updatedUser = await userController.updateUser(req, res);
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update user', error });
    }
});

export default router;
