import { HealthCheckPort } from '../../domain/ports/health-check.port.js';
import { HealthStatus } from '../../domain/entities/health-status.entity.js';
import { GetHealthStatusQuery } from './get-health-status.query.js';

export class GetHealthStatusHandler {
  constructor(private readonly healthCheckPort: HealthCheckPort) {}

  async handle(query: GetHealthStatusQuery): Promise<HealthStatus> {
    return await this.healthCheckPort.checkHealth();
  }
}