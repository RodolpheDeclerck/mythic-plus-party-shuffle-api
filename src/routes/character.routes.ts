import { Router } from 'express';
import { characterController } from '../controllers/character.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements

const router = Router();

// POST request to create a new character
router.post('/characters', async (req, res) => {
  try {
    await characterController.createCharacter(req, res);
    io.emit('character-updated');  // Émettre un événement après la création
  } catch (error) {
    res.status(500).json({ message: 'Failed to create character', error });
  }
});

// GET request to get all characters
router.get('/characters', (req, res) => characterController.getAllCharacters(req, res));

// GET request to get a character by ID
router.get('/characters/:id', (req, res) => characterController.getCharacterById(req, res));

// PUT request to update a character by ID
router.put('/characters/:id', async (req, res) => {
  try {
    await characterController.updateCharacter(req, res);
    io.emit('character-updated');  // Émettre un événement après la mise à jour
  } catch (error) {
    res.status(500).json({ message: 'Failed to update character', error });
  }
});

// DELETE request to delete a character by ID
router.delete('/characters/:id', async (req, res) => {
  try {
    await characterController.deleteCharacter(req, res);
    io.emit('character-updated');  // Émettre un événement après la suppression
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete character', error });
  }
});

export default router;

