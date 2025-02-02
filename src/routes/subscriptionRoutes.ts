import express from 'express';
import { auth } from '../middleware/auth';
import {
  createPayment,
  checkPaymentStatus,
  handleWebhook,
  getUserSubscription,
  getPaymentHistory,
  getPaymentLink
} from '../controllers/subscriptionController';

const router = express.Router();

// Protected routes (require authentication)
router.post('/create-payment', auth, createPayment);
router.get('/payment-status/:paymentId', auth, checkPaymentStatus);
router.get('/subscription', auth, getUserSubscription);
router.get('/payment-history', auth, getPaymentHistory);
router.get('/payment-link', auth, getPaymentLink);

// Webhook endpoint (public)
router.post('/webhook', handleWebhook);

export default router; 