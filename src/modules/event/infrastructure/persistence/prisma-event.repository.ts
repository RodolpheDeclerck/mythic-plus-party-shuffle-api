import prisma from '../../../../config/prisma.js';
import { EventRepositoryPort } from '../../domain/ports/event-repository.port.js';
import { Event } from '../../domain/entities/event.entity.js';
import { Character } from '../../domain/entities/character.entity.js';

export class PrismaEventRepository implements EventRepositoryPort {
  async findAll(): Promise<Event[]> {
    const prismaEvents = await prisma.appEvent.findMany();
    return prismaEvents.map(
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
    const prismaEvent = await prisma.appEvent.findFirst({ where: { code } });
    if (!prismaEvent) {
      return null;
    }

    return new Event(
      prismaEvent.id,
      prismaEvent.code,
      prismaEvent.name,
      prismaEvent.createdAt,
      prismaEvent.expiresAt,
      prismaEvent.updatedAt,
      prismaEvent.arePartiesVisible,
      prismaEvent.createdById
    );
  }

  async findCharactersByEventCode(eventCode: string): Promise<Character[]> {
    const prismaCharacters = await prisma.character.findMany({ where: { eventCode } });
    return prismaCharacters.map(
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
