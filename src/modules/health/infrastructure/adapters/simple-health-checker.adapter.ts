import { HealthStatus } from '../../domain/entities/health-status.entity.js';
import { HealthCheckerPort } from '../../domain/ports/health-checker.port.js';

export class SimpleHealthCheckerAdapter implements HealthCheckerPort {
  async checkHealth(): Promise<HealthStatus> {
    return HealthStatus.healthy();
  }
}