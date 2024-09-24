import { Router } from 'express';
import { partyController } from '../controllers/party.controller.js';

const router = Router();

// Route pour mélanger et créer de nouveaux groupes
router.get('/parties/shuffle', partyController.shuffleParties);

// Route pour récupérer les groupes actuels à partir de Redis
router.get('/parties', partyController.getParties);

export default router;
