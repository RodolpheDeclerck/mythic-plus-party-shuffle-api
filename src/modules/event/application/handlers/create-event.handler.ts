import { CreateEventCommand } from '../commands/create-event.command.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { EventDto } from '../dto/event.dto.js';

export class CreateEventHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(command: CreateEventCommand): Promise<EventDto> {
    const event = await this.eventRepository.create(command.name, command.createdById);

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
