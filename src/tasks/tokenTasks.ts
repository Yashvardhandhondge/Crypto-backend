import { TokenService } from '../services/TokenService';
import Token from '../models/Token';
import axios from 'axios';

export const startTokenTasks = () => {
  // Update CookieFun tokens every 5 minutes
  setInterval(async () => {
    try {
      await TokenService.fetchCookieFunTokens();
    } catch (error) {
      console.error('CookieFun token update failed:', error);
    }
  }, 5 * 60 * 1000);

  // Update Binance tokens every 10 minutes
  setInterval(async () => {
    try {
      await TokenService.fetchBinanceTokens();
    } catch (error) {
      console.error('Binance token update failed:', error);
    }
  }, 10 * 60 * 1000);

  // Update Bybit tokens every 10 minutes
  setInterval(async () => {
    try {
      await TokenService.fetchBybitTokens();
    } catch (error) {
      console.error('Bybit token update failed:', error);
    }
  }, 10 * 60 * 1000);

  // Update signals for different strategies
  const updateAllSignals = async () => {
    try {
      // Get available signals first
      const response = await axios.get(TokenService.getSignalsUrl());
      const signals = response.data;
      
      if (!Array.isArray(signals)) {
        console.error('Invalid signals data received from API');
        return;
      }

      // Extract available symbols from signals
      const availableSymbols = signals
        .map((s: any) => {
          const match = s.description.match(/\[\$([^\]]+)\]/);
          return match ? match[1].replace(/USDT$/, '') : null;
        })
        .filter((s: string | null) => s !== null);

      console.log('Available symbols from signals:', availableSymbols);

      // Find tokens that match available signals
      const tokens = await Token.find({
        symbol: { 
          $in: availableSymbols.map(s => new RegExp(`^${s}$`, 'i')),
          $not: /^.*(UP|DOWN)$/
        },
        source: 'Binance'
      }).sort({ marketCap: -1 });

      console.log(`Processing ${tokens.length} tokens that match available signals:`, 
        tokens.map(t => t.symbol)
      );
      
      for (const token of tokens) {
        try {
          await TokenService.updateSignals(token);
        } catch (error) {
          console.error(`Error updating signals for token ${token.symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Signal update failed:', error);
      throw error;
    }
  };

  // Update signals every 5 minutes instead of every hour while testing
  setInterval(updateAllSignals, 5 * 60 * 1000);

  // Initial updates
  TokenService.fetchCookieFunTokens();
  TokenService.fetchBinanceTokens();
  TokenService.fetchBybitTokens();
  updateAllSignals();
};

// Remove or comment out the cleanup functionality for now
// export const cleanupOldSignals = async () => {
//   try {
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     await TokenService.cleanupSignals(thirtyDaysAgo);
//     console.log('Old signals cleaned up successfully');
//   } catch (error) {
//     console.error('Signal cleanup failed:', error);
//   }
// };

// // Run cleanup daily
// setInterval(cleanupOldSignals, 24 * 60 * 60 * 1000);