import { Request, Response } from 'express';
import { GetHealthStatusHandler } from '../../application/handlers/get-health-status.handler.js';
import { GetHealthStatusQuery } from '../../application/queries/get-health-status.query.js';

export class HealthController {
  private readonly getHealthStatusHandler: GetHealthStatusHandler;

  constructor() {
    this.getHealthStatusHandler = new GetHealthStatusHandler();
  }

  getHealth = (_req: Request, res: Response): void => {
    const query = new GetHealthStatusQuery();
    const healthStatus = this.getHealthStatusHandler.handle(query);

    res.status(200).json(healthStatus);
  };
}
