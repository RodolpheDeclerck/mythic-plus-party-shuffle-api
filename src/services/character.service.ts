import { AppDataSource } from '../config/data-source.js';
import { Character } from '../entities/character.entity.js';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { CharacterDto } from '../dto/character.dto.js';
import { In } from 'typeorm';
import { AppEvent as Event } from '../entities/event.entity.js';

class CharacterService {
    async createCharacter(data: CharacterDto): Promise<Character> {

        const characterRepository = AppDataSource.getRepository(Character);
        const eventRepository = AppDataSource.getRepository(Event);

        console.log('data:', data);

        console.log('Event code being searched:', data.eventCode);

        // Récupérer l'événement auquel le personnage sera associé
        const event = await eventRepository.findOne({ where: { code: data.eventCode } });

        if (!event) {
            throw new Error('Event not found');
        }

        // Créer une nouvelle instance de personnage
        const character = new Character();
        character.name = data.name;
        character.characterClass = data.characterClass;

        const specializationInfo = SpecializationDetails[data.specialization];

        if (!specializationInfo) {
            throw new Error(`Invalid specialization: ${data.specialization}`);
        }

        character.specialization = data.specialization;
        character.iLevel = data.iLevel;
        character.role = specializationInfo.role;
        character.bloodLust = specializationInfo.bloodLust;
        character.battleRez = specializationInfo.battleRez;
        character.event = event;

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

    async updateCharactersEventToNull(ids: number[]): Promise<void> {
        const characterRepository = AppDataSource.getRepository(Character);

        // Récupérer les personnages avec les IDs fournis
        const characters = await characterRepository.find({
            where: {
                id: In(ids),
            },
        });

        if (characters.length !== ids.length) {
            throw new Error('One or more characters not found');
        }

        // Mettre à jour l'événement associé de chaque personnage pour qu'il soit `null`
        await Promise.all(
            characters.map(async (character) => {
                character.event = null;
                await characterRepository.save(character);
            })
        );
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

        // Mettre à jour les propriétés sauf l'événement
        character.name = data.name;
        character.characterClass = data.characterClass;

        // Récupérer les détails de la spécialisation
        const specializationInfo = SpecializationDetails[data.specialization];

        if (!specializationInfo) {
            throw new Error(`Invalid specialization: ${data.specialization}`);
        }

        character.specialization = data.specialization;
        character.iLevel = data.iLevel;
        character.role = specializationInfo.role;
        character.bloodLust = specializationInfo.bloodLust;
        character.battleRez = specializationInfo.battleRez;

        if (data.eventCode) {
            const eventRepository = AppDataSource.getRepository(Event);

            // Récupérer l'événement auquel le personnage sera associé
            const event = await eventRepository.findOne({ where: { code: data.eventCode } });

            if (!event) {
                throw new Error('Event not found');
            }

            character.event = event;
        }

        // Suppression de toute référence à `event`

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