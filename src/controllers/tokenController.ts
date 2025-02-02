import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Token from '../models/Token';

export class TokenController {
  static async getTokens(req: Request, res: Response) {
    try {
      const { 
        range = '100', 
        source = 'CookieFun',
        sortBy = 'marketCap',
        sortDir = 'desc'
      } = req.query;

      // Parse range (e.g., "100" or "101-200")
      let skip = 0;
      let limit = 100;

      if (range.toString().includes('-')) {
        const [start, end] = range.toString().split('-').map(Number);
        skip = start - 1;
        limit = end - start + 1;
      } else {
        limit = parseInt(range.toString());
      }

      // Only include tokens that are at least 13 days old
      const minLaunchDate = new Date();
      minLaunchDate.setDate(minLaunchDate.getDate() - 13);

      const tokens = await Token.find({
        source,
        launchDate: { $lte: minLaunchDate }
      })
        .sort({ [sortBy.toString()]: sortDir === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await Token.countDocuments({
        source,
        launchDate: { $lte: minLaunchDate }
      });

      res.json({
        tokens,
        total,
        range: {
          start: skip + 1,
          end: Math.min(skip + limit, total)
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getTokenDetails(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const token = await Token.findOne({ symbol });
      
      if (!token) {
        res.status(404).json({ message: 'Token not found' });
        return;
      }

      res.json(token);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching token details' });
    }
  }

  static async searchTokens(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      const tokens = await Token.find({
        symbol: { $regex: query, $options: 'i' }
      });
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: 'Error searching tokens' });
    }
  }

  static async toggleFavorite(_req: AuthRequest, res: Response): Promise<void> {
    try {
      // Your favorite toggle logic
      res.json({ message: 'Favorite toggled' });
    } catch (error) {
      res.status(500).json({ message: 'Error toggling favorite' });
    }
  }

  static async getFavorites(_req: AuthRequest, res: Response): Promise<void> {
    try {
      // Your get favorites logic
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching favorites' });
    }
  }

  static async getSignals(req: AuthRequest, res: Response) {
    try {
      const { strategy } = req.query;
      const { subscription } = req.user;

      let limit = subscription.status === 'Premium' ? undefined : 3;

      const query = {
        'signals.strategy': strategy || { $exists: true }
      };

      const tokens = await Token.find(query)
        .sort({ 'signals.timestamp': -1 })
        .limit(limit || 0);

      const signals = tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        signals: subscription.status === 'Premium' 
          ? token.signals
          : token.signals.slice(0, 3) // Only return last 3 signals for free users
      }));

      res.json({
        signals,
        subscription: subscription.status
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}