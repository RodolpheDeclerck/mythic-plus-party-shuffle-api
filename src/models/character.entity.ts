import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CharacterClass } from '../enums/characterClass.enum';
import { Role } from '../enums/role.enum';
import { Specialization } from '../enums/specialization.enum';
import { SpecializationDetails } from '../data/specializationsDetails.data';
import { Party } from './party.entity';

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

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ default: false })
  bloodLust!: boolean;

  @Column({ default: false })
  battleRez!: boolean;

  constructor(name?: string, characterClass?: CharacterClass, specialization?: Specialization) {
    if (name && characterClass && specialization) {

    this.name = name;
    this.characterClass = characterClass;

    const specializationInfo = SpecializationDetails[specialization];

    if (!specializationInfo) {
      throw new Error(`Invalid specialization: ${specialization}`);
    }
    
    this.specialization = specialization;
    this.role = specializationInfo.role;
    this.bloodLust = specializationInfo.bloodLust;
    this.battleRez = specializationInfo.battleRez;
   }
  }

}
