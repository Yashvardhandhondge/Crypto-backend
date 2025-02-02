import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  percentChange24h: number;
  rank: number;
  launchDate: Date;
  riskLevel: number;
  source: 'CookieFun' | 'Binance' | 'Bybit';
  contract?: string;
  chain?: string;
  signals: {
    strategy: string;
    timestamp: Date;
    type: 'buy' | 'sell';
    price: number;
    confidence: number;
  }[];
}

const tokenSchema = new Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  marketCap: {
    type: Number,
    required: true,
  },
  volume24h: {
    type: Number,
    required: true,
  },
  percentChange24h: {
    type: Number,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  launchDate: {
    type: Date,
    required: true,
  },
  riskLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  source: {
    type: String,
    required: true,
    enum: ['CookieFun', 'Binance', 'Bybit'],
  },
  contract: {
    type: String,
  },
  chain: {
    type: String,
  },
  signals: [{
    strategy: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    }
  }]
}, {
  timestamps: true,
});

// Index for efficient queries
tokenSchema.index({ symbol: 1, source: 1 }, { unique: true });
tokenSchema.index({ rank: 1 });
tokenSchema.index({ marketCap: -1 });
tokenSchema.index({ launchDate: -1 });

export default mongoose.model<IToken>('Token', tokenSchema);