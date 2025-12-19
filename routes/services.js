import express from 'express';
import auth from '../middleware/auth.js';
import { listServices } from '../controllers/servicesController.js';

const router = express.Router();

router.get('/', auth, listServices);

export default router;
