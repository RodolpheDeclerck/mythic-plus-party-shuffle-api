import { Request, Response } from 'express';
import { Party } from '../models/party.entity.js';
import { partyFacade } from '../facade/party.facade.js';

class PartyController {
    async shuffleParties(req: Request, res: Response): Promise<Response> {
        try {
            const parties = await partyFacade.shuffleAndSaveGroups();
            return res.status(200).json(parties);
        } catch (error: any) {
            console.error('Error shuffling groups:', error);
            return res.status(500).json({
                message: 'An error occurred while shuffling groups',
                error: error.message || error.toString()
            });
        }
    }

    async fetchParties(): Promise<Party[]> {
        try {
            console.log('Fetching parties from Redis...');
            const parties = await partyFacade.getPartiesFromRedis();
            console.log('Fetched parties:', parties);
            return parties; // Return the parties
        } catch (error) {
            console.error('Error in fetchParties:', error);
            throw error; // Rethrow the error
        }
    }
}

// Exportation de la classe sans utiliser `new`
export const partyController = new PartyController();
