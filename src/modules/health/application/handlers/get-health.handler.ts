import { HealthStatus } from '../../domain/entities/health-status.entity.js';
import { HealthCheckerPort } from '../../domain/ports/health-checker.port.js';
import { GetHealthQuery } from '../queries/get-health.query.js';

export class GetHealthHandler {
  constructor(private readonly healthChecker: HealthCheckerPort) {}

  async handle(query: GetHealthQuery): Promise<HealthStatus> {
    return this.healthChecker.checkHealth();
  }
}