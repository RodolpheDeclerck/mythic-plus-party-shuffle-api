import { Router } from 'express';
import { partyController } from '../controllers/party.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements

const router = Router();

router.delete('/events/:eventCode/parties', async (req, res) => {
    try {
        await partyController.deleteParties(req, res);
        io.emit('parties-updated');  // Émettre un événement lorsque les groupes sont supprimés)
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete parties', error });
    }
});

router.post('/events/:eventCode/parties', async (req, res) => {
    await partyController.createOrUpdateParties(req, res);
    io.emit('parties-updated');  // Émettre un événement lorsque les groupes sont creés ou mis à jour)
})

export default router; 
