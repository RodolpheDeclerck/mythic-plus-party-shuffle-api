import { HealthCheckPort } from '../../domain/ports/health-check.port.js';
import { HealthStatus } from '../../domain/entities/health-status.entity.js';

export class BasicHealthCheckAdapter implements HealthCheckPort {
  async checkHealth(): Promise<HealthStatus> {
    const version = process.env.npm_package_version || '1.0.0';
    return new HealthStatus('healthy', new Date(), version);
  }
}