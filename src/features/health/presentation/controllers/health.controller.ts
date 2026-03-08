import { Request, Response } from 'express';
import { GetHealthStatusHandler } from '../../application/queries/get-health-status.handler.js';
import { GetHealthStatusQuery } from '../../application/queries/get-health-status.query.js';

export class HealthController {
  constructor(private readonly getHealthStatusHandler: GetHealthStatusHandler) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetHealthStatusQuery();
      const healthStatus = await this.getHealthStatusHandler.handle(query);

      res.status(200).json({
        status: healthStatus.getStatus(),
        timestamp: healthStatus.getTimestamp().toISOString(),
        version: healthStatus.getVersion(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      });
    }
  }
}