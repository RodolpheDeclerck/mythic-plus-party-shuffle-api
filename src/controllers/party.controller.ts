import { Request, Response } from 'express';
import { Party } from '../models/party.entity.js';
import { partyFacade } from '../facade/party.facade.js';
import { partyService } from '../services/party.service.js';

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
            const parties = await partyService.getGroupsFromRedis();
            return res.status(200).json(parties);
        } catch (error: any) {
            console.error('Error retrieving groups:', error);
            return res.status(500).json({
                message: 'An error occurred while retrieving groups',
                error: error.message || error.toString(),
            });
        }
    }

    async deleteParties(req: Request, res: Response): Promise<Response> {
        try {
            await partyService.deleteGroupsFromRedis();
            return res.status(200).json({ message: 'Parties deleted successfully' });
        } catch (error: any) {
            console.error('Error deleting groups:', error);
            return res.status(500).json({
                message: 'An error occurred while deleting groups',
                error: error.message || error.toString(),
            });
        }
    }

    async createOrUpdateParties(req: Request, res: Response): Promise<Response> {
        try {
            const parties: Party[] = req.body;
            await partyService.createOrUpdatePartiesToRedis(parties);
            return res.status(200).json({ message: 'Parties created or updated successfully' });
        } catch (error: any) {
            console.error('Error creating or updating groups:', error);
            return res.status(500).json({
                message: 'An error occurred while creating or updating groups',
                error: error.message || error.toString(),
            });
        }
    }
}

export const partyController = new PartyController();
