import { User } from '../models/user.entity.js'; // Assure-toi que le chemin vers ton modèle User est correct

declare global {
  namespace Express {
    interface Request {
      identity?: User; // Ajoute la propriété identity à l'objet Request
    }
  }
}
