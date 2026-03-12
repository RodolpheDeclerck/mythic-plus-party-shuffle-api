import { VersionDto } from '../dto/version.dto.js';
import { GetVersionQuery } from '../queries/get-version.query.js';

export class GetVersionHandler {
  handle(_query: GetVersionQuery): VersionDto {
    return {
      version: '1.0.0',
    };
  }
}
