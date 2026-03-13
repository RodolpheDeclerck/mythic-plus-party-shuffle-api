import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { CreateEventCommand } from '../commands/create-event.command.js';
import { Event } from '../../domain/entities/event.entity.js';

export class CreateEventHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(command: CreateEventCommand): Promise<Event> {
    return await this.eventRepository.create(command.name, command.createdById);
  }
}
