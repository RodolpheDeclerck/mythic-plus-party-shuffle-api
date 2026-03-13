import { GetVersionHandler } from './get-version.handler.js';
import { GetVersionQuery } from '../queries/get-version.query.js';
import { VersionDto } from '../dto/version.dto.js';

describe('GetVersionHandler', () => {
  let handler: GetVersionHandler;

  beforeEach(() => {
    handler = new GetVersionHandler();
  });

  describe('execute', () => {
    it('should return a VersionDto with version string', async () => {
      // Arrange
      const query = new GetVersionQuery();

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeInstanceOf(VersionDto);
      expect(result.version).toBe('1.0.0');
      expect(typeof result.version).toBe('string');
    });

    it('should return consistent version on multiple calls', async () => {
      // Arrange
      const query = new GetVersionQuery();

      // Act
      const result1 = await handler.execute(query);
      const result2 = await handler.execute(query);

      // Assert
      expect(result1.version).toBe(result2.version);
    });
  });
});
