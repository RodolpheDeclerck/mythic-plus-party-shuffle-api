import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { SetPartiesVisibilityCommand } from '../commands/set-parties-visibility.command.js';

export class SetPartiesVisibilityHandler {
  constructor(private readonly eventRepository: EventRepositoryPort) {}

  async execute(command: SetPartiesVisibilityCommand): Promise<void> {
    await this.eventRepository.setPartiesVisibility(command.eventCode, command.visible);
  }
}
