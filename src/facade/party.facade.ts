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
    async getPartiesFromRedis(): Promise<Party[]> {
        const redisKey = 'party:1';
        try {
            const partiesJson = await redisClient.get(redisKey);

            if (partiesJson) {
                // Retourner le tableau des parties
                return JSON.parse(partiesJson) as Party[];
            } else {
                // Retourner un tableau vide si aucune donnée n'est trouvée
                return [];
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des parties depuis Redis:', error);
            throw new Error('Échec de la récupération des parties');
        }
    }

    // Méthode privée pour sauvegarder les groupes dans Redis
    private async saveGroupsToRedis(parties: Party[]): Promise<void> {
        await redisClient.set('party:1', JSON.stringify(parties));
    }
}

export const partyFacade = new PartyFacade();
