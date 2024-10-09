import { Router } from 'express';
import { partyController } from '../controllers/party.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements

const router = Router();

// Route pour mélanger et créer de nouveaux groupes
router.get('/parties/shuffle', async (req, res) => {
    try {
        // Appel de shuffleParties et récupération des groupes mélangés
        const shuffledParties = await partyController.shuffleParties(req);

        // Émission de l'événement WebSocket avec les groupes mélangés
        io.emit('parties-updated', shuffledParties);

        // Envoyer la réponse HTTP
        return res.status(200).json(shuffledParties);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to shuffle parties', error });
    }
});

router.delete('/parties', async (req, res) => {
    try {
        await partyController.deleteParties(req, res);
        io.emit('parties-updated');  // Émettre un événement lorsque les groupes sont supprimés)
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete parties', error });
    }
});

router.post('/parties', async (req, res) => {
    await partyController.createOrUpdateParties(req, res);
    io.emit('parties-updated');  // Émettre un événement lorsque les groupes sont supprimés)
})


// Route pour récupérer les groupes actuels à partir de Redis
router.get('/parties', partyController.getParties);

export default router; 
