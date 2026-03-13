import { GetVersionQuery } from '../queries/get-version.query.js';
import { VersionDto } from '../dto/version.dto.js';

export class GetVersionHandler {
  async execute(query: GetVersionQuery): Promise<VersionDto> {
    const version = '1.0.0';
    return new VersionDto(version);
  }
}
