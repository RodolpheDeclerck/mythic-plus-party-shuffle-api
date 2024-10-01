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
        await this.saveGroupsToRedis(parties);

        return parties;
    }

    // Méthode pour récupérer les groupes à partir de Redis
    async getGroupsFromRedis(): Promise<Party[]> {
        const redisKey = 'party:1';
        const partiesJson = await redisClient.get(redisKey);

        if (partiesJson) {
            return JSON.parse(partiesJson);
        } else {
            throw new Error('No parties found in Redis');
        }
    }

    // Méthode privée pour sauvegarder les groupes dans Redis
    private async saveGroupsToRedis(parties: Party[]): Promise<void> {
        try {
            // Log des données à sauvegarder dans Redis
            console.log('Données à sauvegarder dans Redis:', JSON.stringify(parties));

            // Écriture dans Redis
            await redisClient.set('party:1', JSON.stringify(parties));

            // Confirmation de l'écriture réussie
            console.log('Écriture dans Redis réussie pour party:1');
        } catch (error) {
            // Log en cas d'erreur
            console.error('Erreur lors de l\'écriture des groupes dans Redis:', error);
        }
    }

    async deleteGroupsFromRedis(): Promise<void> {
        await redisClient.set('party:1',JSON.stringify([]));
    }
}

export const partyFacade = new PartyFacade();
