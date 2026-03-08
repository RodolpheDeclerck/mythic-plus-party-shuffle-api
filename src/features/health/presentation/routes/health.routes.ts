import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { GetHealthStatusHandler } from '../../application/queries/get-health-status.handler.js';
import { BasicHealthCheckAdapter } from '../../infrastructure/adapters/basic-health-check.adapter.js';

const router = Router();

const healthCheckAdapter = new BasicHealthCheckAdapter();
const getHealthStatusHandler = new GetHealthStatusHandler(healthCheckAdapter);
const healthController = new HealthController(getHealthStatusHandler);

router.get('/health', (req, res) => healthController.getHealth(req, res));

export default router;