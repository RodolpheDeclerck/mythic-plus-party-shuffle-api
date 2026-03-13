import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { DeleteEventCommand } from '../commands/delete-event.command.js';

export class DeleteEventHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(command: DeleteEventCommand): Promise<void> {
    await this.eventRepository.deleteByCode(command.eventCode);
  }
}
