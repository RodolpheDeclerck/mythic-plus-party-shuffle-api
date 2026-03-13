import { Event } from '../../domain/entities/event.entity.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetAllEventsQuery } from '../queries/get-all-events.query.js';

export class GetAllEventsHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetAllEventsQuery): Promise<Event[]> {
    return await this.eventRepository.findAll();
  }
}
