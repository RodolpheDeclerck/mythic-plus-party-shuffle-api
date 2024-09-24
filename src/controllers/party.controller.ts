import { Request, Response } from 'express';
import { partyFacade } from '../facade/party.facade';

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

    async getParties(req: Request, res: Response): Promise<Response> {
        try {
            const parties = await partyFacade.getGroupsFromRedis();
            return res.status(200).json(parties);
        } catch (error: any) {
            console.error('Error retrieving groups:', error);
            return res.status(500).json({
                message: 'An error occurred while retrieving groups',
                error: error.message || error.toString()
            });
        }
    }
}

// Exportation de la classe sans utiliser `new`
export const partyController = new PartyController();
