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


// Route pour récupérer les parties
router.get('/parties', async (req, res) => {
    try {
        const parties = await partyController.fetchParties();
        res.json(parties); // Renvoie les parties au client
    } catch (error) {
        console.error('Erreur lors de la récupération des parties:', error);
        res.status(500).json({ message: 'Échec de la récupération des parties' });
    }
});

export default router;
