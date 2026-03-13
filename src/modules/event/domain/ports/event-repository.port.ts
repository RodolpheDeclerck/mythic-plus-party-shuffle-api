import { Event } from '../entities/event.entity.js';
import { Character } from '../entities/character.entity.js';

export interface EventRepositoryPort {
  findAll(): Promise<Event[]>;
  findByCode(code: string): Promise<Event | null>;
  findCharactersByEventCode(eventCode: string): Promise<Character[]>;
}
