import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { GetHealthStatusHandler } from '../../application/handlers/get-health-status.handler.js';
import { SimpleHealthCheckService } from '../../infrastructure/services/simple-health-check.service.js';

const router = Router();

// Dependency injection setup - in a real NestJS app, this would be handled by the DI container
const healthCheckService = new SimpleHealthCheckService();
const getHealthStatusHandler = new GetHealthStatusHandler(healthCheckService);
const healthController = new HealthController(getHealthStatusHandler);

router.get('/health', (req, res) => healthController.getHealth(req, res));

export default router;