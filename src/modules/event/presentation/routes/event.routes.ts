import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { isAuthenticated, isAdminOfEvent } from '../../../../middlewares/authenticateJWT.js';

const router = Router();
const eventController = new EventController();

router.get('/events', (req, res) => eventController.getEvents(req, res));
router.get('/events/:eventCode/characters', (req, res) =>
  eventController.getEventCharacters(req, res)
);
router.post('/events', isAuthenticated, (req, res) => eventController.createEvent(req, res));
router.delete('/events/:eventCode', isAuthenticated, isAdminOfEvent, (req, res) =>
  eventController.deleteEvent(req, res)
);
router.patch('/events/:eventCode/setPartiesVisibility', (req, res) =>
  eventController.setPartiesVisibility(req, res)
);

export default router;
