import { Router } from 'express';
import { HealthController } from './health.controller.js';
import { GetHealthHandler } from '../application/queries/get-health.handler.js';
import { HealthRepositoryImpl } from '../infrastructure/health.repository.impl.js';

const router = Router();

// Dependency injection setup for health feature
const healthRepository = new HealthRepositoryImpl();
const getHealthHandler = new GetHealthHandler(healthRepository);
const healthController = new HealthController(getHealthHandler);

router.get('/health', (req, res) => healthController.getHealth(req, res));

export default router;