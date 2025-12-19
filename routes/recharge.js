import express from 'express';
import { body, param, query } from 'express-validator';
import { SERVICE_TYPE_IDS } from '../constants/services.js';
import { getServiceDefinition } from '../constants/services.js';
import {
  initiateRecharge,
  getRechargeStatus,
  getRechargeHistory,
  retryRecharge,
  getRechargeSummary,
} from '../controllers/rechargeController.js';
import validate from '../middleware/validator.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const initiateRechargeValidation = [
  body('serviceType')
    .trim()
    .isIn(SERVICE_TYPE_IDS)
    .withMessage('Service type is invalid'),
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Identifier is required')
    .bail()
    .custom((value, { req }) => {
      const definition = getServiceDefinition(req.body.serviceType);
      if (!definition) return true;
      if (definition.identifierPattern && !definition.identifierPattern.test(value)) {
        throw new Error(`${definition.identifierLabel || 'Identifier'} is invalid`);
      }
      return true;
    }),
  body('operator')
    .isObject()
    .withMessage('Operator is required')
    .custom((value) => {
      if (!value.code) {
        throw new Error('Operator code is required');
      }
      return true;
    }),
  body('plan')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      const definition = getServiceDefinition(req.body.serviceType);
      if (definition?.planRequired && (!value || !value.id)) {
        throw new Error('Plan id is required');
      }
      return true;
    }),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['UPI', 'Card', 'Wallet'])
    .withMessage('Payment method must be UPI, Card, or Wallet'),
];

const retryValidation = [
  param('transactionId').notEmpty().withMessage('Transaction ID is required'),
];

const historyValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .customSanitizer((value) => value.toUpperCase())
    .isIn(['SUCCESS', 'FAILED', 'PENDING'])
    .withMessage('Status filter must be SUCCESS, FAILED, or PENDING'),
  query('serviceType')
    .optional()
    .customSanitizer((value) => value.trim().toUpperCase())
    .isIn(SERVICE_TYPE_IDS)
    .withMessage('Service type filter must be valid'),
  query('identifier').optional().trim(),
  query('transactionId').optional().trim(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
];

router.post('/', auth, validate(initiateRechargeValidation), initiateRecharge);
router.get('/history', auth, validate(historyValidation), getRechargeHistory);
router.get('/summary/metrics', auth, getRechargeSummary);
router.get('/:transactionId', auth, getRechargeStatus);
router.post('/retry/:transactionId', auth, validate(retryValidation), retryRecharge);

export default router;
