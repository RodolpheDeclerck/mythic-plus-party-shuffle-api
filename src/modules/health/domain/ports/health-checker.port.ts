import { HealthStatus } from '../entities/health-status.entity.js';

export interface HealthCheckerPort {
  checkHealth(): Promise<HealthStatus>;
}