import prisma from '../../../../config/prisma.js';
import { Event } from '../../domain/entities/event.entity.js';
import { Character } from '../../domain/entities/character.entity.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';

export class PrismaEventRepository implements EventRepositoryPort {
  async findAll(): Promise<Event[]> {
    const events = await prisma.appEvent.findMany();
    return events.map(
      (event) =>
        new Event(
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

  async findByCode(code: string): Promise<Event | null> {
    const event = await prisma.appEvent.findFirst({ where: { code } });
    if (!event) return null;

    return new Event(
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

  async findCharactersByEventCode(eventCode: string): Promise<Character[]> {
    const characters = await prisma.character.findMany({ where: { eventCode } });
    return characters.map(
      (character) =>
        new Character(
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
  }
}
