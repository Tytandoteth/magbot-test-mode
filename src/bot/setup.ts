import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { config } from '../config';
import { logger } from '../services/logger';
import { 
  deduplicationMiddleware, 
  loggingMiddleware, 
  errorHandlerMiddleware 
} from './middleware';
import { handleStart } from './handlers/start';
import { handleHelp } from './handlers/help';
import { handleCallback } from './handlers/callback';
import { handleGetLoan } from './handlers/loans';
import { handleVerificationRequest } from './handlers/verification';
import { handleWalletView, createWallet } from './handlers/wallet';

const isDevelopment = process.env.NODE_ENV === 'development';

export const setupBot = (bot: Telegraf<BotContext>): void => {
  try {
    // Add middleware
    bot.use(deduplicationMiddleware);
    bot.use(loggingMiddleware);
    bot.use(errorHandlerMiddleware);

    // Command handlers
    bot.command('start', handleStart);
    bot.command('help', handleHelp);
    bot.command('getloan', handleGetLoan);
    bot.command('verify', handleVerificationRequest);
    bot.command('wallet', handleWalletView);

    // Callback query handler
    bot.on('callback_query', handleCallback);

    // Error handler
    bot.catch(async (err: unknown, ctx: BotContext) => {
      const error = err instanceof Error ? err : new Error(String(err));
      
      logger.error('Bot error:', { 
        error,
        update: ctx.update,
        chat: ctx.chat,
        user: ctx.from
      });
      
      try {
        await ctx.reply('Sorry, something went wrong. Please try again.');
      } catch (replyError) {
        logger.error('Error sending error message:', { error: replyError });
      }
    });

    // Register commands with Telegram only in production
    if (!isDevelopment) {
      bot.telegram.setMyCommands([
        { command: 'start', description: 'Create wallet and begin' },
        { command: 'verify', description: 'Complete identity verification' },
        { command: 'getloan', description: 'Get a loan' },
        { command: 'wallet', description: 'View wallet details' },
        { command: 'help', description: 'Show help message' }
      ]).catch(error => {
        logger.error('Failed to set commands:', { error });
      });
    }

    logger.info('Bot setup completed');
  } catch (error) {
    logger.error('Error during bot setup:', { error });
    throw error;
  }
};