import { Request, Response } from 'express';
import { Party } from '../models/party.entity.js';
import { partyFacade } from '../facade/party.facade.js';

class PartyController {
    async shuffleParties(req: Request): Promise<Party[]> {
        try {
            const parties = await partyFacade.shuffleAndSaveGroups();
            return parties; // Retourne les parties mélangées
        } catch (error: any) {
            console.error('Error shuffling groups:', error);
            throw new Error('An error occurred while shuffling groups');
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

    async deleteParties(req: Request, res: Response): Promise<Response> {
        try {
            await partyFacade.deleteGroupsFromRedis();
            return res.status(200).json({ message: 'Parties deleted successfully' });
        } catch (error: any) {
            console.error('Error deleting groups:', error);
            return res.status(500).json({
                message: 'An error occurred while deleting groups',
                error: error.message || error.toString()
            });
        }
    }
}

// Exportation de la classe sans utiliser `new`
export const partyController = new PartyController();
