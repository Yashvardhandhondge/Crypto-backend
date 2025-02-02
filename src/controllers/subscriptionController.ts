import { Request, Response } from 'express';
import BoomFiService from '../services/BoomFiService';
import Payment from '../models/Payment';
import User from '../models/User';

export const createPayment = async (req: Request, res: Response): Promise<any> => {
  try {
   // @ts-ignore
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const amount = 49; // Monthly subscription amount
    const paymentId = await BoomFiService.createPayment(userId, amount);

    res.json({ 
      success: true, 
      data: { paymentId } 
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const checkPaymentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { paymentId } = req.params;
    const status = await BoomFiService.checkPaymentStatus(paymentId);
    
    res.json({ 
      success: true, 
      data: status 
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    await BoomFiService.handleWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getUserSubscription = async (req: Request, res: Response) :Promise<any> => {
  try {
   // @ts-ignore
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('subscription');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user.subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
};

export const getPaymentHistory = async (req: Request, res: Response):  Promise<any> => {
  try {
   // @ts-ignore
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

export const getPaymentLink = async (req: Request, res: Response): Promise<any> => {
  try {
   // @ts-ignore
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // You can customize this URL based on your BoomFi setup
    const paymentUrl = 'https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v';

    res.json({ 
      success: true, 
      data: { paymentUrl } 
    });
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
}; 