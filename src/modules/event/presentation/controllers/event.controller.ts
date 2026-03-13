import { Request, Response } from 'express';
import { GetAllEventsHandler } from '../../application/handlers/get-all-events.handler.js';
import { GetEventByCodeHandler } from '../../application/handlers/get-event-by-code.handler.js';
import { GetEventCharactersHandler } from '../../application/handlers/get-event-characters.handler.js';
import { GetAllEventsQuery } from '../../application/queries/get-all-events.query.js';
import { GetEventByCodeQuery } from '../../application/queries/get-event-by-code.query.js';
import { GetEventCharactersQuery } from '../../application/queries/get-event-characters.query.js';
import { EventDto } from '../../application/dto/event.dto.js';
import { CharacterDto } from '../../application/dto/character.dto.js';
import { PrismaEventRepository } from '../../infrastructure/persistence/prisma-event.repository.js';

export class EventController {
  private readonly getAllEventsHandler: GetAllEventsHandler;
  private readonly getEventByCodeHandler: GetEventByCodeHandler;
  private readonly getEventCharactersHandler: GetEventCharactersHandler;

  constructor() {
    const eventRepository = new PrismaEventRepository();
    this.getAllEventsHandler = new GetAllEventsHandler(eventRepository);
    this.getEventByCodeHandler = new GetEventByCodeHandler(eventRepository);
    this.getEventCharactersHandler = new GetEventCharactersHandler(eventRepository);
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (code) {
        const query = new GetEventByCodeQuery(code as string);
        const event = await this.getEventByCodeHandler.execute(query);

        if (!event) {
          res.status(404).json({ message: 'Event not found' });
          return;
        }

        const eventDto = new EventDto(
          event.id,
          event.code,
          event.name,
          event.createdAt,
          event.expiresAt,
          event.updatedAt,
          event.arePartiesVisible,
          event.createdById
        );

        res.json(eventDto);
        return;
      }

      const query = new GetAllEventsQuery();
      const events = await this.getAllEventsHandler.execute(query);

      const eventDtos = events.map(
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

      res.json(eventDtos);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getEventCharacters(req: Request, res: Response): Promise<void> {
    try {
      const { eventCode } = req.params;
      const query = new GetEventCharactersQuery(eventCode);
      const characters = await this.getEventCharactersHandler.execute(query);

      const characterDtos = characters.map(
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

      res.json(characterDtos);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
