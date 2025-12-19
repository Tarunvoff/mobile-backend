import Recharge from '../models/Recharge.js';

const FAILURE_REASONS = [
  'Operator network is busy. Please try again.',
  'Insufficient balance in operator system.',
  'Invalid plan selected for this number.',
  'Technical error occurred. Please retry.',
  'Recharge service temporarily unavailable.',
];

const randomDelay = (minMs, maxMs) =>
  Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

export const determineRechargeStatus = () => {
  const random = Math.random() * 100;
  if (random < 70) return 'SUCCESS';
  if (random < 90) return 'FAILED';
  return 'PENDING';
};

export const determineRetryStatus = () => {
  const random = Math.random() * 100;
  if (random < 80) return 'SUCCESS';
  if (random < 95) return 'FAILED';
  return 'PENDING';
};

export const assignFailureReason = () => {
  const index = Math.floor(Math.random() * FAILURE_REASONS.length);
  return FAILURE_REASONS[index];
};

export const simulateNetworkDelay = () =>
  new Promise((resolve) => {
    const delay = randomDelay(200, 800);
    setTimeout(resolve, delay);
  });

export const schedulePendingResolution = (transactionId, isRetry = false) => {
  const delay = randomDelay(15000, 45000);

  setTimeout(async () => {
    try {
      const finalStatus = Math.random() < (isRetry ? 0.8 : 0.7) ? 'SUCCESS' : 'FAILED';
      const updatePayload = {
        status: finalStatus,
        resolvedAt: new Date(),
      };

      if (finalStatus === 'FAILED') {
        updatePayload.failureReason = assignFailureReason();
      }

      await Recharge.findOneAndUpdate(
        { transactionId, status: 'PENDING' },
        updatePayload,
        { new: true }
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Pending resolution error:', error.message);
    }
  }, delay);
};
