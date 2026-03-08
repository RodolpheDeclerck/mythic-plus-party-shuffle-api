import { Health } from './health.entity.js';

export interface HealthRepository {
  getHealth(): Promise<Health>;
}