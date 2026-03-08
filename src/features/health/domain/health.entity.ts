export class Health {
  constructor(
    private readonly _status: string,
    private readonly _timestamp: Date,
    private readonly _version?: string
  ) {}

  get status(): string {
    return this._status;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get version(): string | undefined {
    return this._version;
  }

  static createHealthy(version?: string): Health {
    return new Health('healthy', new Date(), version);
  }

  static createUnhealthy(version?: string): Health {
    return new Health('unhealthy', new Date(), version);
  }
}