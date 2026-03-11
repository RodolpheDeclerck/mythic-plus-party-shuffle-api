import { GetVersionHandler } from './get-version.handler.js';
import { GetVersionQuery } from '../queries/get-version.query.js';

describe('GetVersionHandler', () => {
  it('should return version DTO with version field', () => {
    const handler = new GetVersionHandler();
    const query = new GetVersionQuery();

    const result = handler.handle(query);

    expect(result).toHaveProperty('version');
    expect(typeof result.version).toBe('string');
    expect(result.version).toBe('1.0.0');
  });
});
