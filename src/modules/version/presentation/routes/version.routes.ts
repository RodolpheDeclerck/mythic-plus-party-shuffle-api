import { Router } from 'express';
import { VersionController } from '../controllers/version.controller.js';

const router = Router();
const versionController = new VersionController();

router.get('/version', versionController.getVersion);

export default router;
