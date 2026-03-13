import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetEventByCodeQuery } from '../queries/get-event-by-code.query.js';
import { EventDto } from '../dto/event.dto.js';

export class GetEventByCodeHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetEventByCodeQuery): Promise<EventDto | null> {
    const event = await this.eventRepository.findByCode(query.code);
    if (!event) {
      return null;
    }

    return new EventDto(
      event.id,
      event.code,
      event.name,
      event.createdAt,
      event.expiresAt,
      event.updatedAt,
      event.arePartiesVisible,
      event.createdById
    );
  }
}
