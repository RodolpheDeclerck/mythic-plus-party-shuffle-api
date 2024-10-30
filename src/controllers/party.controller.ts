import { Request, Response } from 'express';
import { Party } from '../entities/party.entity.js';
import { partyFacade } from '../facade/party.facade.js';
import { partyService } from '../services/party.service.js';
import e from 'cors';

class PartyController {

    async deleteParties(req: Request, res: Response): Promise<Response> {
        try {
            const { eventCode } = req.params;
            await partyService.deleteGroupsFromRedis(eventCode);
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
            const { eventCode } = req.params;
            console.log("createOrUpdateParties");
            await partyService.createOrUpdatePartiesToRedis(parties, eventCode);
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
