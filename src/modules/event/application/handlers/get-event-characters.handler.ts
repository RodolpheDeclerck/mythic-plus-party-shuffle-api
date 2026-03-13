import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetEventCharactersQuery } from '../queries/get-event-characters.query.js';
import { CharacterDto } from '../dto/character.dto.js';

export class GetEventCharactersHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetEventCharactersQuery): Promise<CharacterDto[]> {
    const characters = await this.eventRepository.findCharactersByEventCode(query.eventCode);
    return characters.map(
      (character) =>
        new CharacterDto(
          character.id,
          character.name,
          character.characterClass,
          character.specialization,
          character.iLevel,
          character.role,
          character.bloodLust,
          character.battleRez,
          character.keystoneMinLevel,
          character.keystoneMaxLevel,
          character.eventCode
        )
    );
  }
}
