import { HealthCheckService } from '../../domain/services/health-check.service.js';
import { HealthStatus } from '../../domain/entities/health-status.entity.js';
import { GetHealthStatusQuery } from '../queries/get-health-status.query.js';

export class GetHealthStatusHandler {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  async handle(query: GetHealthStatusQuery): Promise<HealthStatus> {
    return await this.healthCheckService.checkHealth();
  }
}