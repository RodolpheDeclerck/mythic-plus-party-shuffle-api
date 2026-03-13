import { GetVersionHandler } from './get-version.handler.js';
import { GetVersionQuery } from '../queries/get-version.query.js';

describe('GetVersionHandler', () => {
  it('returns version DTO with version string', () => {
    const handler = new GetVersionHandler();
    const query = new GetVersionQuery();
    const result = handler.handle(query);

    expect(result).toEqual({
      version: '1.0.0',
    });
    expect(result.version).toBe('1.0.0');
    expect(typeof result.version).toBe('string');
  });
});
