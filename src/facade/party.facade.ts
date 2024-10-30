import { partyService } from '../services/party.service.js';
import { Party } from '../entities/party.entity.js';
import { eventService } from '../services/event.service.js';
import e from 'cors';

class PartyFacade {

    // Méthode pour mélanger les groupes et les stocker dans Redis
    async shuffleAndSaveGroups(eventCode: string): Promise<Party[]> {
        // Récupérer tous les personnages depuis la base de données via le CharacterService
        const characters = await eventService.getCharactersByEventCode(eventCode);

        // Utiliser le PartyService pour mélanger les groupes
        const parties = await partyService.shuffleGroups(characters, eventCode);

        // Sauvegarder les groupes dans Redis
        await partyService.saveGroupsToRedis(parties, eventCode);

        await partyService.saveShuffleToHistory(eventCode, parties);

        return parties;
    }

}

export const partyFacade = new PartyFacade();
