import { characterService } from '../services/character.service.js';
import { partyService } from '../services/party.service.js';
import { Party } from '../models/party.entity.js';

class PartyFacade {

    // Méthode pour mélanger les groupes et les stocker dans Redis
    async shuffleAndSaveGroups(): Promise<Party[]> {
        // Récupérer tous les personnages depuis la base de données via le CharacterService
        const characters = await characterService.getAllCharacters();
        
        // Utiliser le PartyService pour mélanger les groupes
        const parties = await partyService.shuffleGroups(characters);

        // Sauvegarder les groupes dans Redis
        await partyService.saveGroupsToRedis(parties);

        return parties;
    }

}

export const partyFacade = new PartyFacade();
