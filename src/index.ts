import { Telegraf } from 'telegraf';
import { BotContext, SessionData } from './types';
import { config } from './config';
import { logger } from './logger';
import { setupBot } from './bot/setup';
import { WalletManagerService } from './services/wallet';
import { HealthServer } from './services/health/HealthServer';
import { session } from 'telegraf';

let bot: Telegraf<BotContext>;
let isStarting = false;
let walletManager: WalletManagerService;
let healthServer: HealthServer;
const isDevelopment = process.env.NODE_ENV === 'development';

const startBot = async () => {
  if (isStarting) {
    logger.warn('Bot is already starting');
    return;
  }

  try {
    isStarting = true;

    // Initialize health server
    healthServer = new HealthServer({
      port: config.server.port,
      memoryThreshold: config.server.memoryThreshold
    });
    await healthServer.start();

    // Initialize wallet manager first
    walletManager = new WalletManagerService();
    logger.info('Wallet manager service initialized');

    // Initialize bot if not already initialized
    if (!bot) {
      logger.info('Initializing bot...');
      bot = new Telegraf<BotContext>(config.telegram.botToken);
      
      // Initialize session middleware with local storage
      bot.use(session({
        defaultSession: () => ({
          didVerified: false
        } as SessionData)
      }));

      // Setup bot handlers and middleware
      setupBot(bot);
    }

    // Update health server with bot instance
    healthServer.setBotInstance(bot);

    logger.info('Starting bot...');
    
    try {
      // Launch bot with webhook disabled
      await bot.telegram.deleteWebhook();
      await bot.launch();
      isStarting = false;
      logger.info(`Bot started successfully in ${isDevelopment ? 'development' : 'production'} mode`);
    } catch (launchError) {
      if (launchError instanceof Error && launchError.message.includes('401: Unauthorized')) {
        logger.error('Bot token is invalid or unauthorized');
        throw new Error('Invalid bot token. Please check your configuration.');
      }
      logger.error('Failed to launch bot:', { error: launchError });
      throw launchError;
    }

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        if (bot && !isDevelopment) {
          await bot.stop();
        }
        if (healthServer) {
          await healthServer.stop();
        }
        logger.info('Cleanup completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', { error });
        process.exit(1);
      }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    isStarting = false;
    
    if (error instanceof Error) {
      logger.error('Failed to start bot:', {
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    } else {
      logger.error('Failed to start bot:', { error });
    }
    
    // Stop services if they're running
    try {
      if (healthServer) {
        await healthServer.stop();
      }
    } catch (stopError) {
      logger.error('Error stopping services:', { error: stopError });
    }
    
    // Exit only if not in development
    if (!isDevelopment) {
      process.exit(1);
    }
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', { error });
  if (!isDevelopment) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', { reason });
  if (!isDevelopment) {
    process.exit(1);
  }
});

// Start the bot
startBot();