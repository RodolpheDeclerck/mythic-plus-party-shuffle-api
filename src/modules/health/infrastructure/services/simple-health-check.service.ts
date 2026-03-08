import { HealthCheckService } from '../../domain/services/health-check.service.js';
import { HealthStatus } from '../../domain/entities/health-status.entity.js';

export class SimpleHealthCheckService implements HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    // Simple health check - always returns healthy for now
    // In a real implementation, this could check database connection, external services, etc.
    return HealthStatus.healthy('1.0.0');
  }
}