export class HealthStatus {
  constructor(
    public readonly status: 'healthy' | 'unhealthy',
    public readonly timestamp: Date,
    public readonly services?: Record<string, 'healthy' | 'unhealthy'>
  ) {}

  static healthy(): HealthStatus {
    return new HealthStatus('healthy', new Date());
  }

  static unhealthy(services?: Record<string, 'healthy' | 'unhealthy'>): HealthStatus {
    return new HealthStatus('unhealthy', new Date(), services);
  }
}