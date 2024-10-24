import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppEvent as Event } from './event.entity.js';
import { CharacterClass } from '../enums/characterClass.enum.js';
import { Role } from '../enums/role.enum.js';
import { Specialization } from '../enums/specialization.enum.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CharacterClass })
  characterClass!: CharacterClass;

  @Column({ type: 'enum', enum: Specialization })
  specialization!: Specialization;

  @Column()
  iLevel!: number;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ default: false })
  bloodLust!: boolean;

  @Column({ default: false })
  battleRez!: boolean;

  // Ajout de la relation avec l'entité Event
  @ManyToOne(() => Event, event => event.characters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "eventCode", referencedColumnName: "code" })
  event!: Event;

  constructor(name?: string, characterClass?: CharacterClass, specialization?: Specialization) {
    if (name && characterClass && specialization) {
      this.name = name;
      this.characterClass = characterClass;

      const specializationInfo = SpecializationDetails[specialization];

      if (!specializationInfo) {
        throw new Error(`Invalid specialization: ${specialization}`);
      }

      this.specialization = specialization;
      this.iLevel = this.iLevel;
      this.role = specializationInfo.role;
      this.bloodLust = specializationInfo.bloodLust;
      this.battleRez = specializationInfo.battleRez;
    }
  }
}
