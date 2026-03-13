import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';

const router = Router();
const eventController = new EventController();

router.get('/events', (req, res) => eventController.getEvents(req, res));
router.get('/events/:eventCode/characters', (req, res) =>
  eventController.getEventCharacters(req, res)
);

export default router;
