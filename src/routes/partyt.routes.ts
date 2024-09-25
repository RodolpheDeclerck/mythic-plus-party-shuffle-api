import { Router } from 'express';
import { partyController } from '../controllers/party.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements

const router = Router();

// Route pour mélanger et créer de nouveaux groupes
router.get('/parties/shuffle', async (req, res) => {
    try {
        const shuffledParties = await partyController.shuffleParties(req, res); // Retourne les groupes mélangés
        io.emit('parties-shuffled');
        res.status(200).json(shuffledParties); // Renvoie les groupes mélangés
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to shuffle parties', error });
    }
});


// Route pour récupérer les groupes actuels à partir de Redis
router.get('/parties', async (req, res) => {
    try {
        const shuffledParties = await partyController.getParties(req, res); // Retourne les groupes mélangés
        io.emit('parties-shuffled');
        res.status(200).json(shuffledParties); // Renvoie les groupes mélangés
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to shuffle parties', error });
    }
});
export default router;
