import { HealthStatus } from '../entities/health-status.entity.js';

export interface HealthCheckService {
  checkHealth(): Promise<HealthStatus>;
}