import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';

const router = Router();
const eventController = new EventController();

router.get('/events', eventController.getEvents.bind(eventController));
router.get(
  '/events/:eventCode/characters',
  eventController.getEventCharacters.bind(eventController)
);

export default router;
