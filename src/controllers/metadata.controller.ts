import { Request, Response } from 'express';
import { SpecializationDetails } from '../data/specializationsDetails.data.js';
import { CharacterClass } from '../enums/characterClass.enum.js';
import { Specialization } from '../enums/specialization.enum.js';
import { CharacterClassDetails } from '../data/characterClassDetails.data.js';

class MetadataController {
  // Obtenir la liste des classes
  async getClasses(req: Request, res: Response) {
    try {
      const classes = Object.keys(CharacterClassDetails);
      res.json(classes);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching classes', error });
    }
  }

  // Obtenir la liste des spécialisations pour une classe donnée
  async getSpecializations(req: Request, res: Response) {
    try {
      const characterClass = req.params.characterClass as CharacterClass;
      const specializations = CharacterClassDetails[characterClass]?.specializations;

      if (specializations) {
        res.json(specializations);
      } else {
        res.status(404).json({ message: 'Class not found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching specializations', error });
    }
  }

  // Obtenir les détails d'une spécialisation
  async getSpecializationDetails(req: Request, res: Response) {
    try {
      const specialization = req.params.specialization as Specialization;
      const details = SpecializationDetails[specialization];

      if (details) {
        res.json(details);
      } else {
        res.status(404).json({ message: 'Specialization not found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching specialization details', error });
    }
  }
}

export default new MetadataController();
