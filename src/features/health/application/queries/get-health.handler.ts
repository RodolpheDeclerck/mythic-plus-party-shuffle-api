import { Health } from '../../domain/health.entity.js';
import { HealthRepository } from '../../domain/health.repository.interface.js';
import { GetHealthQuery } from './get-health.query.js';

export class GetHealthHandler {
  constructor(private readonly healthRepository: HealthRepository) {}

  async handle(query: GetHealthQuery): Promise<Health> {
    return this.healthRepository.getHealth();
  }
}