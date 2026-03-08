export class HealthStatus {
  constructor(
    private readonly status: 'healthy' | 'unhealthy',
    private readonly timestamp: Date,
    private readonly version: string
  ) {}

  getStatus(): 'healthy' | 'unhealthy' {
    return this.status;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getVersion(): string {
    return this.version;
  }

  isHealthy(): boolean {
    return this.status === 'healthy';
  }
}