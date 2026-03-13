import { Event } from '../../domain/entities/event.entity.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { GetEventByCodeQuery } from '../queries/get-event-by-code.query.js';

export class GetEventByCodeHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(query: GetEventByCodeQuery): Promise<Event | null> {
    return await this.eventRepository.findByCode(query.code);
  }
}
