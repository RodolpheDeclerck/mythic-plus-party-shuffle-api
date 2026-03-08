import { Request, Response } from 'express';
import { GetHealthStatusHandler } from '../../application/handlers/get-health-status.handler.js';
import { GetHealthStatusQuery } from '../../application/queries/get-health-status.query.js';

export class HealthController {
  constructor(private readonly getHealthStatusHandler: GetHealthStatusHandler) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetHealthStatusQuery();
      const healthStatus = await this.getHealthStatusHandler.handle(query);
      
      const statusCode = healthStatus.isHealthy() ? 200 : 503;
      
      res.status(statusCode).json({
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
        version: healthStatus.version
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