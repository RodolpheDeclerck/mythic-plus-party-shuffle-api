import { GetHealthStatusHandler } from './get-health-status.handler.js';
import { GetHealthStatusQuery } from '../queries/get-health-status.query.js';

describe('GetHealthStatusHandler', () => {
  it('returns healthy status with timestamp', () => {
    const handler = new GetHealthStatusHandler();
    const query = new GetHealthStatusQuery();
    const result = handler.handle(query);

    expect(result).toEqual(
      expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
      })
    );
    expect(result.status).toBe('healthy');
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });
});
