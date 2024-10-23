import express from 'express';
import { get } from 'lodash-es';
import jwt from 'jsonwebtoken';
import { AppEvent } from '../entities/event.entity.js';
import { AppDataSource } from '../config/data-source.js';

// Clé secrète pour vérifier le JWT (utilise une variable d'environnement pour plus de sécurité)
const JWT_SECRET = 'yourSecretKey';

export const isOwner = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id } = req.params;

        const currentUserId = get(req, 'identity._id');

        if (!currentUserId) {
            return res.sendStatus(403);
        }

        if (currentUserId !== id) {
            return res.sendStatus(403);
        }

        next();
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Log des cookies pour déboguer
        console.log('Cookies:', req.cookies);

        // Récupère le token JWT dans le cookie
        const token = req.cookies?.authToken;

        if (!token) {
            return res.status(403).json({ message: 'Authentication token missing' });
        }

        // Vérifie et décode le JWT
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { [key: string]: any }; // Décode le JWT
            console.log('Decoded JWT:', decoded); // Affiche les informations décodées du JWT

            // Vérifie si l'ID utilisateur est présent
            if (!decoded.id) {
                return res.status(401).json({ message: 'User ID missing from token' });
            }

            // Attache les informations utilisateur décodées (par ex. id, email) à la requête
            req.identity = decoded; // Stocke l'identité décodée dans req.identity

            // Passe au prochain middleware ou route
            return next();
        } catch (err) {
            // Si le JWT est invalide ou expiré
            console.error('JWT verification error:', err);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

    } catch (error) {
        // Gère les erreurs générales (problèmes internes)
        console.error('Authentication middleware error:', error);
        return res.status(400).json({ message: 'Authentication error' });
    }
};

// Middleware pour vérifier si l'utilisateur est admin d'un événement


export const isAdminOfEvent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { eventCode } = req.params; // Récupère l'eventCode depuis les paramètres de l'URL
        const currentUserId = req.identity?.id; // Utilise req.identity.id pour récupérer l'ID utilisateur

        // Log pour vérifier l'ID utilisateur
        console.log('Current User ID in isAdminOfEvent:', currentUserId);

        if (!currentUserId) {
            return res.status(403).json({ message: 'Not authenticated' });
        }

        const eventRepository = AppDataSource.getRepository(AppEvent);

        // Recherche l'événement et les administrateurs
        const event = await eventRepository.findOne({ where: { code: eventCode }, relations: ['admins'] });

        if (!event) {
            console.log('Event not found');
            return res.status(404).json({ message: 'Event not found' });
        }

        const isAdmin = event.admins.some(admin => admin.id === currentUserId);

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access forbidden: Not an admin' });
        }

        next();
    } catch (error) {
        console.error('Error in isAdminOfEvent middleware:', error);
        return res.status(400).json({ message: 'Error in isAdminOfEvent middleware', error });
    }
};
