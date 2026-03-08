export class HealthStatus {
  constructor(
    public readonly status: 'healthy' | 'unhealthy',
    public readonly timestamp: Date,
    public readonly version?: string
  ) {}

  static healthy(version?: string): HealthStatus {
    return new HealthStatus('healthy', new Date(), version);
  }

  static unhealthy(): HealthStatus {
    return new HealthStatus('unhealthy', new Date());
  }

  isHealthy(): boolean {
    return this.status === 'healthy';
  }
}