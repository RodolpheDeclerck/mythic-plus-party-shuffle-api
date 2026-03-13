import { Character } from '../../domain/entities/character.entity.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetEventCharactersQuery } from '../queries/get-event-characters.query.js';

export class GetEventCharactersHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetEventCharactersQuery): Promise<Character[]> {
    return await this.eventRepository.findCharactersByEventCode(query.eventCode);
  }
}
