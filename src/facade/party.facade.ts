import { CharacterService } from '../services/character.service.js';
import { PartyService } from '../services/parti.service.js';
import { Party } from '../models/party.entity.js';
import redisClient from '../config/redis-client.js';

class PartyFacade {
    private characterService: CharacterService;
    private partyService: PartyService;

    constructor() {
        this.characterService = new CharacterService();
        this.partyService = new PartyService();
    }

    // Méthode pour mélanger les groupes et les stocker dans Redis
    async shuffleAndSaveGroups(): Promise<Party[]> {
        // Récupérer tous les personnages depuis la base de données via le CharacterService
        const characters = await this.characterService.getAllCharacters();

        // Utiliser le PartyService pour mélanger les groupes
        const parties = await this.partyService.shuffleGroups(characters);

        // Sauvegarder les groupes dans Redis
        await this.savePartiesToRedis(parties);

        return parties;
    }

    // Méthode pour récupérer les groupes à partir de Redis
    async getPartiesFromRedis(): Promise<Party[]> {
        const redisKey = 'party:1';
        try {
            const partiesJson = await redisClient.get(redisKey);
            console.log('Data from Redis:', partiesJson);

            if (partiesJson) {
                return JSON.parse(partiesJson) as Party[];
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error retrieving parties from Redis:', error);
            throw new Error('Failed to retrieve parties');
        }
    }

    // Méthode privée pour sauvegarder les groupes dans Redis
    async savePartiesToRedis(parties: Party[]): Promise<void> {
        const redisKey = 'party:1';
        try {
            await redisClient.set(redisKey, JSON.stringify(parties));
        } catch (error) {
            console.error('Error saving parties to Redis:', error);
            throw new Error('Failed to save parties');
        }
    }
}

export const partyFacade = new PartyFacade();
