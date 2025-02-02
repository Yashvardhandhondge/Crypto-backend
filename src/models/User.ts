import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress?: string;
  subscription: {
    status: 'Free' | 'Premium';
    expiryDate?: Date;
    subscriptionId?: string;
  };
}

const userSchema = new Schema({
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  subscription: {
    status: {
      type: String,
      enum: ['Free', 'Premium'],
      default: 'Free',
    },
    expiryDate: {
      type: Date,
    },
    subscriptionId: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema);