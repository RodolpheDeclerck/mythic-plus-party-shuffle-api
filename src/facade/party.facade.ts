import { CharacterService } from '../services/character.service';
import { PartyService } from '../services/parti.service';
import { Party } from '../models/party.entity';
import redisClient  from '../config/redis-client';

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

    // Méthode pour récupérer les groupes depuis Redis
    async getGroupsFromRedis(): Promise<Party[]> {
        const redisKey = 'party:current';
        const partiesJson = await redisClient.get(redisKey);

        if (partiesJson) {
            return JSON.parse(partiesJson);
        } else {
            throw new Error('No parties found in Redis');
        }
    }

    // Méthode privée pour sauvegarder les groupes dans Redis
    private async saveGroupsToRedis(parties: Party[]): Promise<void> {
        const redisKey = 'party:current';
        await redisClient.set(redisKey, JSON.stringify(parties));
    }
}

export const partyFacade = new PartyFacade();
