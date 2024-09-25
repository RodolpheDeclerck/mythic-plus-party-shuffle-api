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

    // In partyController.ts
    async fetchParties(): Promise<Party[]> {
        try {
            const parties = await partyFacade.getPartiesFromRedis();
            return parties; // Do not call res.json or res.send here
        } catch (error) {
            console.error('Error in fetchParties:', error);
            throw error; // Propagate the error back to the route handler
        }
    }
}

// Exportation de la classe sans utiliser `new`
export const partyController = new PartyController();
