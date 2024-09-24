import { Router } from 'express';
import MetadataController from '../controllers/metadata.controller.js';

const router = Router();

// Route pour obtenir les classes
router.get('/classes', MetadataController.getClasses);

// Route pour obtenir les spécialisations d'une classe
router.get('/specializations/:characterClass', MetadataController.getSpecializations);

// Route pour obtenir les détails d'une spécialisation
router.get('/specializationDetails/:specialization', MetadataController.getSpecializationDetails);

export default router;
