import { DeleteEventCommand } from '../commands/delete-event.command.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';

export class DeleteEventHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(command: DeleteEventCommand): Promise<void> {
    await this.eventRepository.deleteByCode(command.eventCode);
  }
}
