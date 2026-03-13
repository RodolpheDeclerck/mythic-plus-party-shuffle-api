import { randomUUID } from 'crypto';
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

  async create(name: string, createdById: number): Promise<Event> {
    // 1. verify user exists
    const user = await prisma.user.findUnique({ where: { id: createdById } });
    if (!user) {
      throw new Error('User not found');
    }

    // 2. generate code
    const code = randomUUID().slice(0, 8);

    // 3. set expiresAt
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 4. create event
    const event = await prisma.appEvent.create({
      data: {
        name,
        code,
        createdById,
        expiresAt,
        arePartiesVisible: false,
      },
    });

    // 5. create event admin relationship
    await prisma.event_admins.create({
      data: {
        event_id: event.id,
        user_id: createdById,
      },
    });

    // 6. return mapped Event entity
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

  async deleteByCode(code: string): Promise<void> {
    await prisma.appEvent.delete({ where: { code } });
  }

  async setPartiesVisibility(code: string, visible: boolean): Promise<void> {
    await prisma.appEvent.update({
      where: { code },
      data: { arePartiesVisible: visible },
    });
  }
}
