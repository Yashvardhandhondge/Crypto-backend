import axios from 'axios';
import Token from '../models/Token';

interface Signal {
  strategy: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  price: number;
  confidence: number;
  description: string;
  risks: string[];
}

export class TokenService {
  private static readonly COOKIE_API_URL = 'http://3.75.231.25';
  private static readonly BINANCE_API_URL = 'https://api.binance.com/api/v3';
  private static readonly BYBIT_API_URL = 'https://api.bybit.com/v5';

  // Add public method to get signals URL
  static getSignalsUrl(): string {
    return `${this.COOKIE_API_URL}/dex_signals`;
  }

  static async fetchCookieFunTokens() {
    try {
      const response = await axios.get(`${this.COOKIE_API_URL}/dex_risks`);
      const tokens = response.data;

      for (const [symbol, data] of Object.entries(tokens)) {
        const tokenData = data as any;
        
        await Token.findOneAndUpdate(
          { symbol, source: 'CookieFun' },
          {
            name: tokenData.name || symbol,
            price: tokenData.price,
            marketCap: tokenData.marketCap || 0,
            volume24h: tokenData.volume || 0,
            percentChange24h: tokenData['24hChange'] || 0,
            rank: tokenData.rank || 999,
            launchDate: new Date(tokenData.launchDate || Date.now()),
            riskLevel: tokenData.risk || 50,
            contract: tokenData.contract,
            chain: tokenData.chain
          },
          { upsert: true, new: true }
        );
      }

      console.log('CookieFun tokens updated successfully');
    } catch (error) {
      console.error('Error fetching CookieFun tokens:', error);
      throw error;
    }
  }

  static async fetchBinanceTokens() {
    try {
      // Get ticker data
      const tickerResponse = await axios.get(`${this.BINANCE_API_URL}/ticker/24hr`);
      const tokens = tickerResponse.data.filter((t: any) => t.symbol.endsWith('USDT'));

      // Get exchange info for additional details
      const infoResponse = await axios.get(`${this.BINANCE_API_URL}/exchangeInfo`);
      const tokenInfo = new Map(
        infoResponse.data.symbols
          .filter((s: any) => s.quoteAsset === 'USDT')
          .map((s: any) => [s.symbol, s])
      );

      for (const ticker of tokens) {
        const info = tokenInfo.get(ticker.symbol);
        if (!info) continue;

        const symbol = ticker.symbol.replace('USDT', '');
        
        await Token.findOneAndUpdate(
          { symbol, source: 'Binance' },
          {
            name: symbol,
            price: parseFloat(ticker.lastPrice),
            marketCap: parseFloat(ticker.volume) * parseFloat(ticker.lastPrice),
            volume24h: parseFloat(ticker.volume),
            percentChange24h: parseFloat(ticker.priceChangePercent),
            rank: 0, // Will be updated based on market cap
            launchDate: new Date(), // Simplified since onboardDate might not exist
            riskLevel: 50, // Default risk level
          },
          { upsert: true, new: true }
        );
      }

      // Update ranks based on market cap
      const allTokens = await Token.find({ source: 'Binance' }).sort({ marketCap: -1 });
      for (let i = 0; i < allTokens.length; i++) {
        allTokens[i].rank = i + 1;
        await allTokens[i].save();
      }

      console.log('Binance tokens updated successfully');
    } catch (error) {
      console.error('Error fetching Binance tokens:', error);
      throw error;
    }
  }

  static async fetchBybitTokens() {
    try {
      const response = await axios.get(`${this.BYBIT_API_URL}/market/tickers`, {
        params: { category: 'spot' }
      });

      const tokens = response.data.result.list
        .filter((t: any) => t.symbol.endsWith('USDT'));

      for (const ticker of tokens) {
        const symbol = ticker.symbol.replace('USDT', '');
        
        await Token.findOneAndUpdate(
          { symbol, source: 'Bybit' },
          {
            name: symbol,
            price: parseFloat(ticker.lastPrice),
            marketCap: parseFloat(ticker.volume24h) * parseFloat(ticker.lastPrice),
            volume24h: parseFloat(ticker.volume24h),
            percentChange24h: parseFloat(ticker.price24hPcnt) * 100,
            rank: 0, // Will be updated based on market cap
            launchDate: new Date(), // Bybit doesn't provide launch dates
            riskLevel: 50, // Default risk level
          },
          { upsert: true, new: true }
        );
      }

      // Update ranks based on market cap
      const allTokens = await Token.find({ source: 'Bybit' }).sort({ marketCap: -1 });
      for (let i = 0; i < allTokens.length; i++) {
        allTokens[i].rank = i + 1;
        await allTokens[i].save();
      }

      console.log('Bybit tokens updated successfully');
    } catch (error) {
      console.error('Error fetching Bybit tokens:', error);
      throw error;
    }
  }

  static async updateSignals(token: any) {
    try {
      if (!token || !token.symbol) {
        console.error('Invalid token object provided to updateSignals');
        return;
      }

      // Skip tokens with numeric symbols
      if (/^\d+$/.test(token.symbol)) {
        console.log(`Skipping numeric token symbol: ${token.symbol}`);
        return;
      }

      const response = await axios.get(`${this.COOKIE_API_URL}/dex_signals`);
      const signals = response.data;

      if (!Array.isArray(signals)) {
        console.error('Invalid signals data received from API');
        return;
      }

      // Log all available signals once with full details
      if (token.symbol === 'BTC') {
        console.log('Available signals:', signals.map(s => {
          const symbolMatch = s.description.match(/\[\$([^\]]+)\]/);
          const priceMatch = s.description.match(/\$(\d+\.?\d*)/);
          return {
            symbol: symbolMatch ? symbolMatch[1] : 'unknown',
            description: s.description,
            price: priceMatch ? priceMatch[1] : 'unknown',
            risks: s.risks
          };
        }));
      }

      // Normalize token symbol
      const normalizedTokenSymbol = token.symbol.toUpperCase();

      // Find matching signal for this token
      const signal = signals.find((s: any) => {
        if (!s || !s.description) return false;

        // Extract symbol from description using regex
        const symbolMatch = s.description.match(/\[\$([^\]]+)\]/);
        if (!symbolMatch) return false;

        const signalSymbol = symbolMatch[1];
        // More flexible normalization
        const normalizedSignalSymbol = signalSymbol
          .toUpperCase()
          .replace(/USDT$/, ''); // Only remove USDT from the end

        // Log comparison for debugging
        console.log(`Comparing signal "${normalizedSignalSymbol}" with token "${normalizedTokenSymbol}" (Original: ${signalSymbol})`);

        // Try different matching strategies
        const isMatch = (
          normalizedSignalSymbol === normalizedTokenSymbol || // Exact match
          normalizedSignalSymbol.includes(normalizedTokenSymbol) || // Token symbol is part of signal
          normalizedTokenSymbol.includes(normalizedSignalSymbol) // Signal symbol is part of token
        );

        if (isMatch) {
          console.log(`Match found! Signal: ${signalSymbol}, Token: ${token.symbol}`);
          console.log('Signal details:', {
            description: s.description,
            risks: s.risks
          });
        }

        return isMatch;
      });

      if (!signal) {
        // Only log for non-numeric symbols
        if (!/^\d+$/.test(token.symbol)) {
          console.log(`No signal found for token: ${token.symbol} (normalized: ${normalizedTokenSymbol})`);
        }
        return;
      }

      // Extract price from description
      const priceMatch = signal.description.match(/\$(\d+\.?\d*)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : token.price;

      // Initialize signals array if it doesn't exist
      token.signals = token.signals || [];

      // Check if we already have a recent signal (within last hour)
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentSignal = token.signals?.find((s: Signal) => 
        s.description === signal.description && 
        new Date(s.timestamp) > lastHour
      );

      if (recentSignal) {
        console.log(`Skipping duplicate signal for ${token.symbol} (last updated: ${recentSignal.timestamp})`);
        return;
      }

      // Add new signal with more details
      const newSignal: Signal = {
        strategy: 'default',
        timestamp: new Date(),
        type: 'buy',
        price: price,
        confidence: signal.confidence || 75,
        description: signal.description,
        risks: signal.risks || []
      };

      token.signals.push(newSignal);
      console.log(`Added new signal for ${token.symbol}:`, newSignal);

      // Keep only last 100 signals
      if (token.signals.length > 100) {
        token.signals = token.signals.slice(-100);
      }

      await token.save();
      console.log(`Signals updated successfully for token: ${token.symbol}`);
    } catch (error) {
      console.error(`Error updating signals for token ${token?.symbol}:`, error);
      throw error;
    }
  }
}