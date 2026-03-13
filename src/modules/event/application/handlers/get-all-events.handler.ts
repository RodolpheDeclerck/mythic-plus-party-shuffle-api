import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetAllEventsQuery } from '../queries/get-all-events.query.js';
import { EventDto } from '../dto/event.dto.js';

export class GetAllEventsHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetAllEventsQuery): Promise<EventDto[]> {
    const events = await this.eventRepository.findAll();
    return events.map(
      (event) =>
        new EventDto(
          event.id,
          event.code,
          event.name,
          event.createdAt,
          event.expiresAt,
          event.updatedAt,
          event.arePartiesVisible,
          event.createdById
        )
    );
  }
}
