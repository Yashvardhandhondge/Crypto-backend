import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  planType: 'monthly';
  paymentId: string;
  metadata?: {
    walletAddress?: string;
    paymentMethod?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: {
    type: String
  },
  planType: {
    type: String,
    enum: ['monthly'],
    default: 'monthly'
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  metadata: {
    walletAddress: String,
    paymentMethod: String
  }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', paymentSchema); 