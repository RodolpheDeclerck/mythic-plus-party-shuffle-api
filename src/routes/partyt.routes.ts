import { Router } from 'express';
import { partyController } from '../controllers/party.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements

const router = Router();

// Route pour mélanger et créer de nouveaux groupes
router.get('/parties/shuffle', async (req, res) => {
    try {
        await partyController.shuffleParties;
        io.emit('parties-shuffled');  // Émettre l'événement après la mise à jour
        res.status(200).json({ message: 'Parties shuffled successfully' }); // Envoyer une réponse
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to shuffle parties', error });
    }
});


// Route pour récupérer les groupes actuels à partir de Redis
router.get('/parties', partyController.getParties);

export default router;
