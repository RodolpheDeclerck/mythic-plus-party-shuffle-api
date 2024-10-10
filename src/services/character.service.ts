import { AppDataSource } from '../config/data-source.js';
import { Character } from '../models/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { CharacterDto } from '../dto/character.dto.js';
import { In } from 'typeorm';

class CharacterService {
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

    async deleteCharacters(ids: number[]): Promise<void> {
        const characterRepository = AppDataSource.getRepository(Character);

        // Retrieve characters with the provided IDs
        const characters = await characterRepository.find({
            where: {
                id: In(ids),
            },
        });

        if (characters.length !== ids.length) {
            throw new Error('One or more characters not found');
        }

        await characterRepository.remove(characters);
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

    async upsertCharacter(character: CharacterDto): Promise<Character | null> {
        if (character.id && isNaN(Number(character.id))) {
            throw new Error('Invalid character ID');
        }

        let existingCharacter;

        if (character.id) {
            existingCharacter = await this.getCharacterById(character.id);
        }

        if (existingCharacter) {
            return await this.updateCharacter(character.id, character);
        }
        else {
            return await this.createCharacter(character);
        }
    }
}

export const characterService = new CharacterService();