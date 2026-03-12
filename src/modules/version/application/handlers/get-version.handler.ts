import { GetVersionQuery } from '../queries/get-version.query.js';
import { VersionDto } from '../dto/version.dto.js';

export class GetVersionHandler {
  handle(query: GetVersionQuery): VersionDto {
    return {
      version: '1.0.0',
    };
  }
}
