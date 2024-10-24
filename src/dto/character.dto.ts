import { IsString, IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { CharacterClass } from '../enums/characterClass.enum.js';
import { Specialization } from '../enums/specialization.enum.js';

/**
 * DTO pour la création d'un personnage
 */
export class CharacterDto {

  id!: number;

  @IsString()
  @IsNotEmpty({ message: 'Le nom ne doit pas être vide' })
  name!: string;

  @IsEnum(CharacterClass, { message: 'La classe du personnage doit être une valeur valide' })
  @IsNotEmpty({ message: 'La classe ne doit pas être vide' })
  characterClass!: CharacterClass;

  @IsEnum(Specialization, { message: 'La spécialisation doit être une valeur valide' })
  @IsNotEmpty({ message: 'La spécialisation ne doit pas être vide' })
  specialization!: Specialization;

  @IsNumber()
  @IsNotEmpty({ message: 'iLevel ne doit pas etre vide' })
  iLevel!: number;

  @IsNumber()
  eventCode!: string;
}
