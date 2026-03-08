export interface HealthStatusDto {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}