import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { io } from '../app.js';  // Importer l'instance de io pour émettre les événements
import { isAdminOfEvent, isAuthenticated } from '../middlewares/authenticateJWT.js';

const router = Router();

// POST request to create a new event
router.post('/events', isAuthenticated, async (req, res) => {
  try {
    await eventController.createEvent(req, res);
    io.emit('event-updated');  // Émettre un événement après la création
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create event', error });
  }
});

// Route pour récupérer les événements dont l'utilisateur est admin
router.get('/events/admin-events',isAuthenticated,  (req, res) => eventController.getAdminEvents(req, res));

router.get('/events/:eventCode/parties', (req, res) => eventController.getEventParties(req, res));

// GET request to get all events
router.get('/events', (req, res) => eventController.getAllEvents(req, res));

router.get('/events/:eventCode/characters', (req, res) => eventController.getCharacters(req, res));

router.get('/events/:eventId', (req, res) => eventController.getCharacters(req, res));

router.get('/event', (req, res) => eventController.getEventByCode(req, res));

router.delete('/events/:eventCode', isAuthenticated,isAdminOfEvent, async (req, res) => {
  try {
      await eventController.deleteEvent(req, res);
      io.emit('event-updated');  // Émettre un événement lorsque l'événement est supprimé
  } catch (error: any) {
      res.status(500).json({ message: 'Failed to delete event', error });
  }
})

// Route pour mélanger et créer de nouveaux groupes
router.get('/events/:eventCode/shuffle-parties', async (req, res) => {
  try {
      // Appel de shuffleParties et récupération des groupes mélangés
      const shuffledParties = await eventController.shuffleParties(req);

      // Émission de l'événement WebSocket avec les groupes mélangés
      io.emit('parties-updated', shuffledParties);

      // Envoyer la réponse HTTP
      return res.status(200).json(shuffledParties);
  } catch (error: any) {
      return res.status(500).json({ message: 'Failed to shuffle parties', error });
  }
});





export default router;

