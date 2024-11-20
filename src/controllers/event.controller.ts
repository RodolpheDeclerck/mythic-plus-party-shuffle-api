import { Request, Response } from 'express';
import { EventDto } from '../dto/event.dto.js'; // DTO pour l'événement
import { eventService } from '../services/event.service.js'; // Service pour gérer les événements
import { Party } from '../entities/party.entity.js';
import { partyFacade } from '../facade/party.facade.js';
import { partyService } from '../services/party.service.js';
import { get } from 'lodash-es';

class EventController {

    // Méthode pour créer un événement
    async createEvent(req: Request, res: Response): Promise<Response> {
        try {
            const createEventDto: EventDto = req.body;  // Récupère les données du corps de la requête
            const userId = req.identity.id;  // Récupère l'ID de l'utilisateur depuis req.user

            // Ajouter l'ID de l'utilisateur authentifié à l'événement
            const newEvent = await eventService.createEvent({
                ...createEventDto, // Récupère les autres données de l'événement
                createdBy: userId  // Associe l'utilisateur qui crée l'événement
            });

            return res.status(201).json(newEvent);
        } catch (error: any) {
            console.error('Error creating event:', error);  // Log the error
            return res.status(500).json({
                message: 'An error occurred',
                error: error.message || error.toString()  // Return detailed error message
            });
        }
    }

    // Méthode pour obtenir tous les événements
    async getAllEvents(req: Request, res: Response): Promise<Response> {
        try {
            const events = await eventService.getAllEvents();
            return res.json(events);
        } catch (error: any) {
            console.error('Error getting events:', error);  // Log the error
            return res.status(500).json({
                message: 'An error occurred',
                error: error.message || error.toString()  // Return detailed error message
            });
        }
    }

    // Méthode pour obtenir un événement par son ID
    async getEventById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;  // Récupère l'ID de l'événement depuis les paramètres

        try {
            const event = await eventService.getEventById(parseInt(id));

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(event);
        } catch (error: any) {
            console.error('Error getting event by ID:', error);
            return res.status(500).json({ message: error.message || 'Failed to get event' });
        }
    }


    // Méthode pour obtenir un événement par son code
    async getEventByCode(req: Request, res: Response): Promise<Response> {
        const code = req.query.code as string;

        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        try {
            const event = await eventService.getEventByCode(code);

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(event);
        } catch (error: any) {
            console.error('Error getting event by ID:', error);
            return res.status(500).json({ message: error.message || 'Failed to get event' });
        }
    }

    // Méthode pour mettre à jour un événement
    async updateEvent(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const updateEventDto: EventDto = req.body;

        try {
            const updatedEvent = await eventService.updateEvent(parseInt(id), updateEventDto);

            if (!updatedEvent) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(updatedEvent);
        } catch (error: any) {
            console.error('Error updating event:', error);
            return res.status(500).json({
                message: 'Failed to update event',
                error: error.message || error.toString(),
            });
        }
    }

    // Méthode pour supprimer un événement
    async deleteEvent(req: Request, res: Response) {
        const { eventCode } = req.params;  // Récupère l'eventCode depuis les paramètres de l'URL
        try {
            // Suppression de l'événement via eventCode
            await eventService.deleteEvent(eventCode);

            return res.status(200).json({ message: 'Event deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Failed to delete event', error });
        }
    }


    async getCharacters(req: Request, res: Response): Promise<Response> {
        const { eventCode } = req.params;

        try {
            const characters = await eventService.getCharactersByEventCode(eventCode);
            return res.status(200).json(characters);
        } catch (error: any) {
            return res.status(500).json({ message: 'Error retrieving characters', error: error.message });
        }
    }

    async shuffleParties(req: Request): Promise<Party[]> {
        try {
            console.log('Request params: ', req.params);  // Ajoutez cette ligne pour debug
            const { eventCode } = req.params;
            console.log('Controller eventCode: ', eventCode);
            const parties = await partyFacade.shuffleAndSaveGroups(eventCode);
            return parties; // Retourne les parties mélangées
        } catch (error: any) {
            console.error('Error shuffling groups:', error);
            throw new Error('An error occurred while shuffling groups');
        }
    }

    async getEventParties(req: Request, res: Response): Promise<Response> {
        try {
            console.log('Request params: ', req.params);  // Ajoutez cette ligne pour debug
            const { eventCode } = req.params;
            console.log('Controller eventCode: ', eventCode);
            const parties = await partyService.getPartiesByEventCode(eventCode);
            return res.status(200).json(parties);
        } catch (error: any) {
            return res.status(500).json({ message: 'Error retrieving parties', error: error.message });
        }
    }


    async getAdminEvents(req: Request, res: Response): Promise<Response> {
        try {
            // Accède directement à l'id utilisateur à partir de req.identity
            const currentUserId = req.identity?.id; // Utilise req.identity.id au lieu de req.identity._id

            console.log('Current user ID:', currentUserId);

            if (!currentUserId) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Utilise le repository pour trouver tous les événements où l'utilisateur est admin
            const events = await eventService.getEventsByAdmin(currentUserId);

            return res.json(events);
        } catch (error) {
            console.error('Error fetching admin events:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async setPartiesVisibility(req: Request, res: Response): Promise<Response> {
        try {
            const { eventCode } = req.params;
            const { visible } = req.body;
            const updatedEvent = await eventService.setPartiesVisibility(eventCode, visible);
            return res.json(updatedEvent);
        } catch (error) {
            console.error('Error setting parties visibility:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// Exportation du contrôleur
export const eventController = new EventController();
