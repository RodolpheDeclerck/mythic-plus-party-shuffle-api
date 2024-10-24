import { Request, Response } from 'express';
import { getUserByEmail, createUser, updateUserById } from '../services/user.service.js';
import { authentication, random } from '../helpers/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey'; // Utilise une variable d'environnement pour la clé secrète

class AuthenticationController {

  // Méthode utilitaire pour générer et envoyer le JWT dans un cookie
  private generateAndSendToken(res: Response, user: any) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Envoyer le JWT dans un cookie sécurisé
    res.cookie('authToken', token, {
      httpOnly: false, // Empêche l'accès au cookie depuis le client JavaScript (plus sécurisé)
      secure: process.env.NODE_ENV === 'production', // En production, utiliser un cookie sécurisé (HTTPS)
      domain: 'localhost', // Modifier le domaine en production
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // Expire dans 24 heures
    });
  }

  // Méthode utilitaire pour renvoyer une erreur avec log
  private handleError(res: Response, message: string, error: any = null, statusCode: number = 400) {
    console.error(message, error);
    return res.status(statusCode).json({ message });
  }

  // Méthode de connexion
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation des champs requis
      if (!email || !password) {
        return this.handleError(res, 'Email and password are required', null, 400);
      }

      // Récupérer l'utilisateur par email
      const user = await getUserByEmail(email);
      if (!user) {
        return this.handleError(res, 'Invalid credentials', null, 400);
      }

      // Vérification du mot de passe
      const expectedHash = authentication(user.salt as string, password);
      if (user.password !== expectedHash) {
        return this.handleError(res, 'Invalid credentials', null, 403);
      }

      // Optionnel : Mettre à jour les informations utilisateur (par exemple, la dernière connexion)
      await updateUserById(user.id.toString(), user);

      // Générer et envoyer le JWT
      this.generateAndSendToken(res, user);

      // Retourner une réponse avec succès
      return res.status(200).json({ message: 'Login successful' });
    } catch (error: any) {
      return this.handleError(res, 'Error during login', error);
    }
  }

  // Méthode d'inscription
  async register(req: Request, res: Response) {
    try {
      const { email, password, username } = req.body;

      // Validation des champs requis
      if (!email || !password || !username) {
        return this.handleError(res, 'Email, password, and username are required', null, 400);
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return this.handleError(res, 'User already exists', null, 400);
      }

      // Générer un salt et hacher le mot de passe
      const salt = random();
      const hashedPassword = authentication(salt, password);

      // Créer l'utilisateur
      const user = await createUser({
        email,
        username,
        authentication: {
          salt,
          password: hashedPassword,
        },
      });

      // Générer et envoyer le JWT
      this.generateAndSendToken(res, user);

      // Retourner l'utilisateur avec un message de succès
      return res.status(200).json({
        message: 'Registration successful',
        user,
      });
    } catch (error: any) {
      return this.handleError(res, 'Error during registration', error);
    }
  }
}

export default new AuthenticationController();
