import { TelegramConfig } from '../types/config';
import dotenv from 'dotenv';

dotenv.config();

// Development and production bot tokens
const DEV_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7940109705:AAHm3XrCnwCfSMUgkgCSOVEb8X_BFEdwnZs';
const PROD_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Ensure we always have a token
const getBotToken = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const token = isDevelopment ? DEV_BOT_TOKEN : PROD_BOT_TOKEN;
  
  if (!token) {
    throw new Error('Bot token must be provided in production environment');
  }
  
  return token;
};

export const telegramConfig: TelegramConfig = {
  botToken: getBotToken(),
  rateLimitWindow: 60000, // 1 minute in milliseconds
  maxRequestsPerWindow: 20
};