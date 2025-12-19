import express from 'express';
import { body } from 'express-validator';
import { login, signup, me } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validator.js';

const router = express.Router();

const signupValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobileNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile number must be 10 digits starting with 6-9'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('identifier').notEmpty().withMessage('Email or mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.post('/signup', validate(signupValidation), signup);
router.post('/login', validate(loginValidation), login);
router.get('/me', auth, me);

export default router;
