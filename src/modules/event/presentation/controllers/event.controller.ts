import { Request, Response } from 'express';
import { GetAllEventsHandler } from '../../application/handlers/get-all-events.handler.js';
import { GetEventByCodeHandler } from '../../application/handlers/get-event-by-code.handler.js';
import { GetEventCharactersHandler } from '../../application/handlers/get-event-characters.handler.js';
import { GetAllEventsQuery } from '../../application/queries/get-all-events.query.js';
import { GetEventByCodeQuery } from '../../application/queries/get-event-by-code.query.js';
import { GetEventCharactersQuery } from '../../application/queries/get-event-characters.query.js';
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
      const code = req.query.code as string | undefined;

      if (code) {
        const result = await this.getEventByCodeHandler.execute(new GetEventByCodeQuery(code));
        if (!result) {
          res.status(404).json({ message: 'Event not found' });
          return;
        }
        res.json(result);
      } else {
        const result = await this.getAllEventsHandler.execute(new GetAllEventsQuery());
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getEventCharacters(req: Request, res: Response): Promise<void> {
    try {
      const eventCode = req.params.eventCode;
      const result = await this.getEventCharactersHandler.execute(
        new GetEventCharactersQuery(eventCode)
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
