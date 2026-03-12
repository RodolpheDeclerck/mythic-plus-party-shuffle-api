import { GetVersionHandler } from './get-version.handler.js';
import { GetVersionQuery } from '../queries/get-version.query.js';

describe('GetVersionHandler', () => {
  let handler: GetVersionHandler;

  beforeEach(() => {
    handler = new GetVersionHandler();
  });

  it('should return version DTO', () => {
    const query = new GetVersionQuery();
    const result = handler.handle(query);

    expect(result).toHaveProperty('version');
    expect(typeof result.version).toBe('string');
    expect(result.version).toBe('1.0.0');
  });
});
