import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth);

export default router;