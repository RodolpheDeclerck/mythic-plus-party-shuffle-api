import { Request, Response } from 'express';
import { CharacterDto } from '../dto/character.dto.js';
import { Specialization } from '../enums/specialization.enum.js';
import { characterService } from '../services/character.service.js';

class CharacterController {

  // Méthode pour créer un personnage
  async createCharacter(req: Request, res: Response): Promise<Response> {
    try {
      const createCharacterDto: CharacterDto = req.body;  // Validation implicite

      // Validate that specialization is part of the Specialization enum
      if (!Object.values(Specialization).includes(createCharacterDto.specialization as Specialization)) {
        return res.status(400).json({ message: 'Invalid specialization' });
      }

      // Create a new character instance
      const newCharacter = await characterService.createCharacter(createCharacterDto);
      return res.status(201).json(newCharacter);
    } catch (error: any) {
      console.error('Error creating character:', error);  // Log the error
      return res.status(500).json({
        message: 'An error occurred',
        error: error.message || error.toString()  // Return detailed error message
      });
    }
  }

  // Méthode pour obtenir tous les personnages
  async getAllCharacters(req: Request, res: Response): Promise<Response> {
    try {
      console.log('HERE: ', req.params);
      const characters = await characterService.getAllCharacters();
      return res.json(characters);
    } catch (error: any) {
      console.error('Error getting characters:', error);  // Log the error
      return res.status(500).json({
        message: 'An error occurred',
        error: error.message || error.toString()  // Return detailed error message
      });
    }
  }

  async deleteCharacter(req: Request, res: Response): Promise<Response> {
    const { id } = req.params; // Récupérer l'ID du personnage à supprimer

    try {
      await characterService.deleteCharacter(parseInt(id));
      return res.status(200).json({ message: 'Character deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting character:', error);
      return res.status(500).json({ message: error.message || 'Failed to delete character' });
    }
  }

  async deleteCharacters(req: Request, res: Response): Promise<Response> {
    try {
      const { ids } = req.body;

      await characterService.updateCharactersEventToNull(ids);

      return res.status(200).json({ message: 'Characters deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getCharacterById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params; // Récupérer l'ID du personnage

    try {
      const character = await characterService.getCharacterById(parseInt(id));

      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(character);
    } catch (error: any) {
      console.error('Error getting character by ID:', error);
      return res.status(500).json({ message: error.message || 'Failed to get character' });
    }
  }

  async updateCharacter(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const updateCharacterDto: CharacterDto = req.body;

    try {
      // Validation de la spécialisation
      if (!Object.values(Specialization).includes(updateCharacterDto.specialization as Specialization)) {
        return res.status(400).json({ message: 'Invalid specialization' });
      }

      const updatedCharacter = await characterService.updateCharacter(parseInt(id), updateCharacterDto);

      if (!updatedCharacter) {
        return res.status(404).json({ message: 'Character not found' });
      }

      return res.status(200).json(updatedCharacter);
    } catch (error: any) {
      console.error('Error updating character:', error);
      return res.status(500).json({
        message: 'Failed to update character',
        error: error.message || error.toString(),
      });
    }
  }

  async upsertCharacter(req: Request, res: Response): Promise<Response> {
    const updateCharacterDto: CharacterDto = req.body;

    try {
      // Validation de la spécialisation
      if (!Object.values(Specialization).includes(updateCharacterDto.specialization as Specialization)) {
        return res.status(400).json({ message: 'Invalid specialization' });
      }

      const updatedCharacter = await characterService.upsertCharacter(updateCharacterDto);

      if (!updatedCharacter) {
        return res.status(404).json({ message: 'Error upserting character' });
      }

      return res.status(200).json(updatedCharacter);
    } catch (error: any) {
      console.error('Error upserting character:', error);
      return res.status(500).json({
        message: 'Failed to upsert character',
        error: error.message || error.toString(),
      });
    }
  }
}

// Exportation de la classe sans utiliser `new`
export const characterController = new CharacterController();
