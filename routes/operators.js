import express from 'express';
import { getOperators, getOperatorPlans } from '../controllers/operatorController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getOperators);
router.get('/:code/plans', auth, getOperatorPlans);

export default router;
