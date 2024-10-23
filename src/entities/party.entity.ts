import { Character } from './character.entity.js';

export class Party {
  id!: number;

  members: Character[] = [];
}
