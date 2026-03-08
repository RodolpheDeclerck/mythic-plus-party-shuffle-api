import { Request, Response } from 'express';
import { GetHealthHandler } from '../application/queries/get-health.handler.js';
import { GetHealthQuery } from '../application/queries/get-health.query.js';

export class HealthController {
  constructor(private readonly getHealthHandler: GetHealthHandler) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetHealthQuery();
      const health = await this.getHealthHandler.handle(query);
      
      res.status(200).json({
        status: health.status,
        timestamp: health.timestamp,
        version: health.version
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Internal server error'
      });
    }
  }
}