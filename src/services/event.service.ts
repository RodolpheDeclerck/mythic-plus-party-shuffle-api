import { AppDataSource } from '../config/data-source.js'; // Connexion à la base de données TypeORM.
import { AppEvent as Event } from '../entities/event.entity.js';
import { User } from '../entities/user.entity.js';
import { EventDto } from '../dto/event.dto.js';
import { Character } from '../entities/character.entity.js';

class EventService {

    async createEvent(createEventDto: EventDto): Promise<Event> {
        const eventRepository = AppDataSource.getRepository(Event);
        const userRepository = AppDataSource.getRepository(User);

        // Récupère l'utilisateur qui crée l'événement
        const user = await userRepository.findOne({ where: { id: createEventDto.createdBy } });

        if (!user) {
            throw new Error('User not found');
        }

        // Crée un nouvel événement
        const newEvent = new Event();
        newEvent.name = createEventDto.name;
        newEvent.createdBy = user;
        newEvent.admins = [user];

        await eventRepository.save(newEvent);

        return newEvent;
    };

    // Obtenir tous les événements
    async getAllEvents(): Promise<Event[]> {
        const eventRepository = AppDataSource.getRepository(Event);

        // Retourne tous les événements stockés dans la base de données
        return eventRepository.find();
    }

    // Obtenir un événement par son ID
    async getEventById(id: number): Promise<Event | null> {
        const eventRepository = AppDataSource.getRepository(Event);

        // Cherche l'événement par son ID
        const event = await eventRepository.findOne({ where: { id } });

        return event || null;  // Retourne null si l'événement n'est pas trouvé
    }

    // Obtenir un événement par son code
    async getEventByCode(code: string): Promise<Event | null> {
        const eventRepository = AppDataSource.getRepository(Event);

        // Recherche de l'événement par son code
        const event = await eventRepository.findOne({ where: { code } });

        console.log("Event trouvé:", event); // Log pour vérifier le retour de findOne

        return event || null; // Retourne null si aucun événement n'est trouvé
    }

    // Mettre à jour un événement
    async updateEvent(id: number, updateEventDto: EventDto): Promise<Event | null> {
        const eventRepository = AppDataSource.getRepository(Event);

        // Cherche l'événement à mettre à jour
        const eventToUpdate = await eventRepository.findOne({ where: { id } });

        if (!eventToUpdate) {
            return null;  // Retourne null si l'événement n'existe pas
        }

        // Met à jour les propriétés de l'événement avec les données du DTO
        Object.assign(eventToUpdate, updateEventDto);

        // Sauvegarde les changements dans la base de données
        return eventRepository.save(eventToUpdate);
    }

    // Supprimer un événement
    async deleteEvent(eventCode: string): Promise<void> {
        const eventRepository = AppDataSource.getRepository(Event);

        // Supprime l'événement par son ID
        await eventRepository.delete({ code: eventCode });
    }

    async getCharactersByEventCode(eventCode: string): Promise<Character[]> {
        const characterRepository = AppDataSource.getRepository(Character);

        // Cherche tous les personnages associés à l'événement
        return characterRepository.find({
            where: { event: { code: eventCode } },  // Filtre par ID d'événement
        });
    }

    async getEventsByAdmin(userId: string) {
        const eventRepository = AppDataSource.getRepository(Event);

        try {
            // Récupère les événements où l'utilisateur est un admin
            const events = await eventRepository
                .createQueryBuilder('event')
                .innerJoin('event.admins', 'admin', 'admin.id = :userId', { userId })
                .getMany();

            return events;
        } catch (error) {
            console.error('Error fetching admin events:', error);
            throw new Error('Error fetching admin events');
        }
    }
}


export const eventService = new EventService();