import { Health } from '../domain/health.entity.js';
import { HealthRepository } from '../domain/health.repository.interface.js';

export class HealthRepositoryImpl implements HealthRepository {
  async getHealth(): Promise<Health> {
    // Simple health check - in a real implementation, this would check database, redis, etc.
    return Health.createHealthy('1.0.0');
  }
}