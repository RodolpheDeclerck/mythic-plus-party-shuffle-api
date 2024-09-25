import { Request, Response } from 'express';
import { CharacterService } from '../services/character.service.js';
import { CharacterDto } from '../dto/character.dto.js';
import { Specialization } from '../enums/specialization.enum.js';

class CharacterController {
  private characterService: CharacterService;

  constructor() {
    this.characterService = new CharacterService();
  }

  // Method to create a new character
  async createCharacter(req: Request, res: Response): Promise<Response> {
    try {
      const createCharacterDto: CharacterDto = req.body;

      // Validate that specialization is part of the Specialization enum
      if (!Object.values(Specialization).includes(createCharacterDto.specialization as Specialization)) {
        return res.status(400).json({ message: 'Invalid specialization' });
      }

      // Create a new character instance
      const newCharacter = await this.characterService.createCharacter(createCharacterDto);
      return res.status(201).json(newCharacter);
    } catch (error: unknown) {
      console.error('Error creating character:', error);
      return res.status(500).json({
        message: 'An error occurred',
        error: (error instanceof Error) ? error.message : error
      });
    }
  }

  // Method to retrieve all characters
  async getAllCharacters(req: Request, res: Response): Promise<Response> {
    try {
      const characters = await this.characterService.getAllCharacters();
      return res.json(characters);
    } catch (error: unknown) {
      console.error('Error getting characters:', error);
      return res.status(500).json({
        message: 'An error occurred',
        error: (error instanceof Error) ? error.message : error
      });
    }
  }

  // Method to delete a character by ID
  async deleteCharacter(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;  // Get the character ID from the request parameters

    try {
      await this.characterService.deleteCharacter(parseInt(id));
      return res.status(200).json({ message: 'Character deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting character:', error);
      return res.status(500).json({
        message: (error instanceof Error) ? error.message : 'Failed to delete character',
      });
    }
  }

  // Method to get a character by ID
  async getCharacterById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;  // Get the character ID from the request parameters

    try {
      const character = await this.characterService.getCharacterById(parseInt(id));

      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(character);
    } catch (error: unknown) {
      console.error('Error getting character by ID:', error);
      return res.status(500).json({
        message: (error instanceof Error) ? error.message : 'Failed to get character'
      });
    }
  }

  // Method to update a character by ID
  async updateCharacter(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const updateCharacterDto: CharacterDto = req.body;

    try {
      // Validate that specialization is part of the Specialization enum
      if (!Object.values(Specialization).includes(updateCharacterDto.specialization as Specialization)) {
        return res.status(400).json({ message: 'Invalid specialization' });
      }

      const updatedCharacter = await this.characterService.updateCharacter(parseInt(id), updateCharacterDto);

      if (!updatedCharacter) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(updatedCharacter);
    } catch (error: unknown) {
      console.error('Error updating character:', error);
      return res.status(500).json({
        message: 'Failed to update character',
        error: (error instanceof Error) ? error.message : error,
      });
    }
  }
}

// Export an instance of the CharacterController
export const characterController = new CharacterController();
