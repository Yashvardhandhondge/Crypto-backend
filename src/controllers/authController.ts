import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static generateToken(user: any) {  // Changed to static method
    return jwt.sign(
      { _id: user._id?.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      // Check if user already exists
      let user = await User.findOne({ walletAddress });
      
      if (user) {
        // Generate token for existing user
        const token = AuthController.generateToken(user);  // Use class name directly
        res.status(200).json({ 
          message: 'User already exists',
          token,
          user
        });
        return;
      }

      // Create new user
      user = new User({ walletAddress });
      await user.save();

      // Generate token for new user
      const token = AuthController.generateToken(user);  // Use class name directly

      res.status(201).json({ 
        message: 'User created successfully',
        token,
        user 
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { walletAddress } = req.body;

      // Find user by wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate token
      const token = AuthController.generateToken(user);  // Use class name directly

      res.json({
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          subscription: user.subscription
        },
        token
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subscription } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { subscription },
        { new: true }
      );
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        walletAddress: user.walletAddress,
        subscription: user.subscription
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({
        walletAddress: user.walletAddress,
        subscription: user.subscription
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }
}