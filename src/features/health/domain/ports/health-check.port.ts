import { HealthStatus } from '../entities/health-status.entity.js';

export interface HealthCheckPort {
  checkHealth(): Promise<HealthStatus>;
}