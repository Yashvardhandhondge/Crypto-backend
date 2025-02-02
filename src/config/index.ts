import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coinchart',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  boomFiApiKey: process.env.BOOMFI_API_KEY || '',
  boomFiApiUrl: process.env.BOOMFI_API_URL || 'https://api.boomfi.xyz',
  env: process.env.NODE_ENV || 'development',
};