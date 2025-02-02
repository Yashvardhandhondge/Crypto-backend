import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has active premium subscription
    if (user.subscription.status !== 'Premium' || 
        (user.subscription.expiryDate && new Date() > user.subscription.expiryDate)) {
      res.status(403).json({ 
        error: 'Premium subscription required',
        currentStatus: user.subscription.status,
        expiryDate: user.subscription.expiryDate
      });
      return;
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Subscription required' });
  }
};