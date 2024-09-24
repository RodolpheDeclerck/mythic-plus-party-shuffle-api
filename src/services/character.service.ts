import { AppDataSource } from '../config/data-source.js';
import { Character } from '../models/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { CharacterDto } from '../dto/character.dto.js';

export class CharacterService {
    async createCharacter(data: CharacterDto): Promise<Character> {

        const characterRepository = AppDataSource.getRepository(Character);

        // Créer une nouvelle instance de personnage
        const character = new Character();
        character.name = data.name;
        character.characterClass = data.characterClass;

        const specializationInfo = SpecializationDetails[data.specialization];

        if (!specializationInfo) {
            throw new Error(`Invalid specialization: ${data.specialization}`);
        }

        character.specialization = data.specialization;
        character.role = specializationInfo.role;
        character.bloodLust = specializationInfo.bloodLust;
        character.battleRez = specializationInfo.battleRez;

        // Sauvegarder le personnage dans la base de données
        await characterRepository.save(character);

        return character;
    }

    async getAllCharacters(): Promise<Character[]> {
        const characterRepository = AppDataSource.getRepository(Character);
        const characters = await characterRepository.find();
        return characters;
    }

    async deleteCharacter(id: number): Promise<void> {
        const characterRepository = AppDataSource.getRepository(Character);

        const character = await characterRepository.findOneBy({ id });

        if (!character) {
            throw new Error(`Character with ID ${id} not found`);
        }

        await characterRepository.remove(character);
    }

    async getCharacterById(id: number): Promise<Character | null> {
        const characterRepository = AppDataSource.getRepository(Character);

        // Rechercher un personnage avec l'ID spécifié
        const character = await characterRepository.findOne({ where: { id } });

        return character;
    }

    async updateCharacter(id: number, data: CharacterDto): Promise<Character | null> {
        const characterRepository = AppDataSource.getRepository(Character);

        // Cherche le personnage à mettre à jour
        const character = await characterRepository.findOneBy({ id });

        if (!character) {
            throw new Error(`Character with ID ${id} not found`);
        }

        // Mettre à jour les propriétés
        character.name = data.name;
        character.characterClass = data.characterClass;

        // Récupérer les détails de la spécialisation
        const specializationInfo = SpecializationDetails[data.specialization];

        if (!specializationInfo) {
            throw new Error(`Invalid specialization: ${data.specialization}`);
        }

        character.specialization = data.specialization;
        character.role = specializationInfo.role;
        character.bloodLust = specializationInfo.bloodLust;
        character.battleRez = specializationInfo.battleRez;

        // Sauvegarder les modifications
        await characterRepository.save(character);

        return character;
    }
}
