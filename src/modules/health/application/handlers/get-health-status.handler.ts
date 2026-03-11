import { HealthStatusDto } from '../dto/health-status.dto.js';
import { GetHealthStatusQuery } from '../queries/get-health-status.query.js';

export class GetHealthStatusHandler {
  handle(_query: GetHealthStatusQuery): HealthStatusDto {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
