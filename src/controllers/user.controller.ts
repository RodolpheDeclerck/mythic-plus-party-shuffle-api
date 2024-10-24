import { Request, Response } from 'express';
import { deleteUserById, getUserById, getUsers, updateUserById } from '../services/user.service.js';

class UserController {
  // Obtenir tous les utilisateurs
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await getUsers();
      res.status(200).json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(400).json({ message: 'Error fetching users', error });
    }
  }

  // Supprimer un utilisateur par ID
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedUser = await deleteUserById(Number(id));

      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(deletedUser);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(400).json({ message: 'Error deleting user', error });
    }
  }

  // Mettre à jour un utilisateur par ID
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }

      const user = await getUserById(parseInt(id));

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.username = username;
      await updateUserById(id, user);

      res.status(200).json(user);
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(400).json({ message: 'Error updating user', error });
    }
  }
}

export default new UserController();
