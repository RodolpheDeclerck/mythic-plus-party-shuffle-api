import { Request, Response } from 'express';
import { GetHealthHandler } from '../../application/handlers/get-health.handler.js';
import { GetHealthQuery } from '../../application/queries/get-health.query.js';
import { SimpleHealthCheckerAdapter } from '../../infrastructure/adapters/simple-health-checker.adapter.js';

export class HealthController {
  private readonly getHealthHandler: GetHealthHandler;

  constructor() {
    const healthChecker = new SimpleHealthCheckerAdapter();
    this.getHealthHandler = new GetHealthHandler(healthChecker);
  }

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetHealthQuery();
      const healthStatus = await this.getHealthHandler.handle(query);
      
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
        services: healthStatus.services
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed'
      });
    }
  }
}