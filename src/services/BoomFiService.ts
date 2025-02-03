import axios from 'axios';
import config from '../config';
import Payment from '../models/Payment';
import User from '../models/User';
import { Types } from 'mongoose';

interface BoomFiResponse {
  data: {
    paymentId: string;
    status: string;
    amount: number;
    transactionHash?: string;
  }
}

class BoomFiService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    //@ts-ignore
    this.apiKey = config.BOOMFI_API_KEY;
    //@ts-ignore
    this.apiUrl = config.BOOMFI_API_URL;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async createPayment(userId: Types.ObjectId, amount: number): Promise<string> {
    try {
      const response = await axios.post<BoomFiResponse>(
        `${this.apiUrl}/payments`,
        {
          amount,
          planType: 'monthly',
          metadata: {
            userId: userId.toString()
          }
        },
        { headers: this.getHeaders() }
      );

      await Payment.create({
        userId,
        amount,
        paymentId: response.data.data.paymentId,
        planType: 'monthly'
      });

      return response.data.data.paymentId;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async handleWebhook(payload: any) {
    try {
      console.log('Webhook payload:', payload);
      const { paymentId, status, transactionHash } = payload.data;

      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = status;
      payment.transactionHash = transactionHash;
      await payment.save();

      if (status === 'completed') {
        await this.updateUserSubscription(payment.userId);
      }

      return true;
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async updateUserSubscription(userId: Types.ObjectId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Set subscription expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    user.subscription = {
      status: 'Premium',
      expiryDate,
      subscriptionId: new Types.ObjectId().toString()
    };

    await user.save();
  }

  async checkPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get<BoomFiResponse>(
        `${this.apiUrl}/payments/${paymentId}`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error('Failed to check payment status');
    }
  }
}

export default new BoomFiService(); 